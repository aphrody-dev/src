// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Embedded BurntSushi `ripgrep` (`grep-regex` + `grep-searcher` + `ignore`) SIMD engine.
//! Scans giant monorepos (Chromium, VS Code, LLVM, UE 5.8) in parallel without spawning subprocesses.

#![forbid(unsafe_code)]

use crate::error::{ErrorKind, N2bError, N2bResult};
use grep_regex::RegexMatcherBuilder;
use grep_searcher::sinks::UTF8;
use grep_searcher::{BinaryDetection, SearcherBuilder};
use ignore::WalkBuilder;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchHit {
    pub path: String,
    pub line_number: u64,
    pub line_preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchStats {
    pub pattern: String,
    pub files_searched: usize,
    pub total_matches: usize,
    pub elapsed_ms: f64,
    pub hits: Vec<SearchHit>,
}

pub struct RipgrepEngine {
    pub max_hits: usize,
    pub respect_gitignore: bool,
}

impl Default for RipgrepEngine {
    fn default() -> Self {
        Self {
            max_hits: 500,
            respect_gitignore: true,
        }
    }
}

impl RipgrepEngine {
    pub fn search_monorepo(&self, root: &Path, pattern: &str) -> N2bResult<SearchStats> {
        let t0 = Instant::now();
        let matcher = RegexMatcherBuilder::new()
            .multi_line(false)
            .build(pattern)
            .map_err(|e| N2bError::new(ErrorKind::ParseFailure, format!("regex `{pattern}`: {e}")))?;

        let files_searched = AtomicUsize::new(0);
        let total_matches = AtomicUsize::new(0);
        let hits: Mutex<Vec<SearchHit>> = Mutex::new(Vec::with_capacity(self.max_hits.min(256)));
        let max_hits = self.max_hits;

        let threads = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(8);

        let mut builder = WalkBuilder::new(root);
        builder
            .threads(threads)
            .hidden(false)
            .git_ignore(self.respect_gitignore)
            .git_global(false)
            .git_exclude(self.respect_gitignore)
            .filter_entry(|entry| {
                let name = entry.file_name().to_str().unwrap_or("");
                !matches!(
                    name,
                    ".git" | "node_modules" | "target" | "DerivedDataCache" | ".egstore"
                )
            });

        builder.build_parallel().run(|| {
            let matcher = matcher.clone();
            let mut searcher = SearcherBuilder::new()
                .binary_detection(BinaryDetection::quit(b'\x00'))
                .line_number(true)
                .build();
            let files_ref = &files_searched;
            let matches_ref = &total_matches;
            let hits_ref = &hits;

            Box::new(move |result| {
                let entry = match result {
                    Ok(e) => e,
                    Err(_) => return ignore::WalkState::Continue,
                };
                if !entry.file_type().is_some_and(|ft| ft.is_file()) {
                    return ignore::WalkState::Continue;
                }
                files_ref.fetch_add(1, Ordering::Relaxed);

                let path = entry.path();
                let rel_display = path
                    .strip_prefix(root)
                    .unwrap_or(path)
                    .to_string_lossy()
                    .replace('\\', "/");

                let _ = searcher.search_path(
                    &matcher,
                    path,
                    UTF8(|lnum, line| {
                        let prev = matches_ref.fetch_add(1, Ordering::Relaxed);
                        if prev < max_hits {
                            let mut guard = hits_ref.lock();
                            if guard.len() < max_hits {
                                let trimmed = line.trim();
                                let preview = if trimmed.len() > 200 {
                                    let mut end = 200;
                                    while !trimmed.is_char_boundary(end) {
                                        end -= 1;
                                    }
                                    format!("{}...", &trimmed[..end])
                                } else {
                                    trimmed.to_string()
                                };
                                guard.push(SearchHit {
                                    path: rel_display.clone(),
                                    line_number: lnum,
                                    line_preview: preview,
                                });
                            }
                        }
                        Ok(true)
                    }),
                );
                ignore::WalkState::Continue
            })
        });

        let mut collected = hits.into_inner();
        collected.sort_by(|a, b| a.path.cmp(&b.path).then(a.line_number.cmp(&b.line_number)));

        Ok(SearchStats {
            pattern: pattern.to_string(),
            files_searched: files_searched.load(Ordering::Relaxed),
            total_matches: total_matches.load(Ordering::Relaxed),
            elapsed_ms: t0.elapsed().as_secs_f64() * 1000.0,
            hits: collected,
        })
    }
}
