// SPDX-License-Identifier: Apache-2.0 OR MIT
//! High-throughput parallel monorepo scanner built on `ignore::WalkParallel`, `blake3`,
//! and `magika_lite` content detection. Designed from day 1 for 50k–500k file monorepos
//! (Chromium, VS Code, Electron, TypeScript, LLVM, Unreal Engine 5.8).

#![forbid(unsafe_code)]

use crate::error::{ErrorKind, N2bError, N2bResult};
use crate::magika_lite::{ContentCategory, detect_content};
use ignore::WalkBuilder;
use parking_lot::Mutex;
use rustc_hash::FxHashMap;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::time::Instant;

#[derive(Debug, Clone)]
pub struct ScanOptions {
    pub max_files: usize,
    pub compute_blake3: bool,
    pub respect_gitignore: bool,
    pub include_binaries: bool,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            max_files: 500_000,
            compute_blake3: false,
            respect_gitignore: true,
            include_binaries: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileRecord {
    pub relative_path: String,
    pub size_bytes: u64,
    pub category: ContentCategory,
    pub confidence: f32,
    pub blake3_hex: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonorepoScanReport {
    pub root_path: String,
    pub total_files: usize,
    pub total_bytes: u64,
    pub elapsed_ms: f64,
    pub files_per_sec: f64,
    pub category_counts: Vec<(String, usize)>,
    pub category_bytes: Vec<(String, u64)>,
    pub sample_files: Vec<FileRecord>,
}

type CategoryTotalsMap = FxHashMap<ContentCategory, (usize, u64)>;
type ScanAccumulator = (CategoryTotalsMap, Vec<FileRecord>);

pub struct MonorepoWalker;

impl MonorepoWalker {
    pub fn scan(root: &Path, opts: &ScanOptions) -> N2bResult<MonorepoScanReport> {
        if !root.exists() {
            return Err(N2bError::new(
                ErrorKind::InvalidPath,
                format!("scan root does not exist: {}", root.display()),
            ));
        }

        let t0 = Instant::now();
        let total_files = AtomicUsize::new(0);
        let total_bytes = AtomicU64::new(0);
        let agg: Mutex<ScanAccumulator> =
            Mutex::new((FxHashMap::default(), Vec::with_capacity(512)));

        let threads = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(8);

        let mut builder = WalkBuilder::new(root);
        builder
            .threads(threads)
            .hidden(false)
            .git_ignore(opts.respect_gitignore)
            .git_global(false)
            .git_exclude(opts.respect_gitignore)
            .filter_entry(|entry| {
                let name = entry.file_name().to_str().unwrap_or("");
                !matches!(
                    name,
                    ".git" | "node_modules" | "target" | "DerivedDataCache" | ".egstore" | "Saved"
                )
            });

        struct ThreadBatch<'a> {
            agg_ref: &'a Mutex<ScanAccumulator>,
            counts: CategoryTotalsMap,
            samples: Vec<FileRecord>,
        }

        impl Drop for ThreadBatch<'_> {
            fn drop(&mut self) {
                if self.counts.is_empty() && self.samples.is_empty() {
                    return;
                }
                let mut guard = self.agg_ref.lock();
                for (k, (c, b)) in self.counts.drain() {
                    let e = guard.0.entry(k).or_insert((0, 0));
                    e.0 += c;
                    e.1 += b;
                }
                if guard.1.len() < 256 {
                    let room = 256 - guard.1.len();
                    let take = self.samples.len().min(room);
                    guard.1.extend(self.samples.drain(..take));
                }
            }
        }

        builder.build_parallel().run(|| {
            let mut batch = ThreadBatch {
                agg_ref: &agg,
                counts: FxHashMap::default(),
                samples: Vec::new(),
            };
            let files_ref = &total_files;
            let bytes_ref = &total_bytes;
            let mut header_buf = [0u8; 1024];

            Box::new(move |res| {
                let entry = match res {
                    Ok(e) => e,
                    Err(_) => return ignore::WalkState::Continue,
                };
                if !entry.file_type().is_some_and(|ft| ft.is_file()) {
                    return ignore::WalkState::Continue;
                }

                let idx = files_ref.fetch_add(1, Ordering::Relaxed);
                if idx >= opts.max_files {
                    files_ref.fetch_sub(1, Ordering::Relaxed);
                    return ignore::WalkState::Quit;
                }

                let path = entry.path();
                let size = entry.metadata().map(|m| m.len()).unwrap_or(0);

                let mut read_n = 0usize;
                if size > 0
                    && let Ok(mut f) = File::open(path)
                {
                    read_n = f.read(&mut header_buf).unwrap_or(0);
                }

                let sig = detect_content(path, &header_buf[..read_n]);
                if !opts.include_binaries && sig.category.is_binary() {
                    return ignore::WalkState::Continue;
                }

                bytes_ref.fetch_add(size, Ordering::Relaxed);
                let stat = batch.counts.entry(sig.category).or_insert((0, 0));
                stat.0 += 1;
                stat.1 += size;

                if batch.samples.len() < 32 {
                    let blake3_hex = if opts.compute_blake3 && size <= 16 * 1024 * 1024 {
                        std::fs::read(path)
                            .ok()
                            .map(|b| blake3::hash(&b).to_hex().to_string())
                    } else {
                        None
                    };
                    let rel = path
                        .strip_prefix(root)
                        .unwrap_or(path)
                        .to_string_lossy()
                        .replace('\\', "/");
                    batch.samples.push(FileRecord {
                        relative_path: rel,
                        size_bytes: size,
                        category: sig.category,
                        confidence: sig.confidence,
                        blake3_hex,
                    });
                }

                ignore::WalkState::Continue
            })
        });
        let elapsed_ms = t0.elapsed().as_secs_f64() * 1000.0;
        let files_count = total_files.load(Ordering::Relaxed);
        let bytes_count = total_bytes.load(Ordering::Relaxed);
        let guard = agg.into_inner();

        let mut category_counts: Vec<(String, usize)> = guard
            .0
            .iter()
            .map(|(k, (c, _))| (k.as_label().to_string(), *c))
            .collect();
        category_counts.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));

        let mut category_bytes: Vec<(String, u64)> = guard
            .0
            .iter()
            .map(|(k, (_, b))| (k.as_label().to_string(), *b))
            .collect();
        category_bytes.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));

        let mut sample_files = guard.1;
        sample_files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));

        let files_per_sec = if elapsed_ms > 0.0 {
            (files_count as f64) / (elapsed_ms / 1000.0)
        } else {
            files_count as f64
        };

        Ok(MonorepoScanReport {
            root_path: root.to_string_lossy().replace('\\', "/"),
            total_files: files_count,
            total_bytes: bytes_count,
            elapsed_ms,
            files_per_sec,
            category_counts,
            category_bytes,
            sample_files,
        })
    }
}
