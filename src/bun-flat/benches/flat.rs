//! Before/after for the first flattened lot: what `ay` did before (std, blake3) against the bun
//! crates now linked (wyhash, sort by number, HdrHistogram). `cargo bench -p aphrody-bun-flat`;
//! `BENCH_CORPUS=<dir>` hashes every .md/.mdx file under it (the docs pipeline's real input),
//! otherwise a generated 8 MiB corpus. Prints one TSV row per case: case, before, after, speedup.

use bun_flat::histogram::Histogram;
use bun_flat::sort_by_number::SortByNumber;
use bun_flat::wyhash::Wyhash;
use std::hash::{DefaultHasher, Hasher};
use std::hint::black_box;
use std::time::{Duration, Instant};

fn median(mut runs: Vec<Duration>) -> Duration {
    runs.sort();
    runs[runs.len() / 2]
}

fn time(rounds: usize, mut f: impl FnMut()) -> Duration {
    f();
    median(
        (0..rounds)
            .map(|_| {
                let t = Instant::now();
                f();
                t.elapsed()
            })
            .collect(),
    )
}

fn row(case: &str, before_name: &str, before: Duration, after: Duration) {
    println!(
        "{case}\t{before_name} {:.3} ms\tbun {:.3} ms\tx{:.2}",
        before.as_secs_f64() * 1e3,
        after.as_secs_f64() * 1e3,
        before.as_secs_f64() / after.as_secs_f64()
    );
}

fn corpus() -> Vec<Vec<u8>> {
    if let Some(dir) = std::env::var_os("BENCH_CORPUS") {
        let mut files = Vec::new();
        let mut stack = vec![std::path::PathBuf::from(dir)];
        while let Some(d) = stack.pop() {
            for e in std::fs::read_dir(&d).into_iter().flatten().flatten() {
                let p = e.path();
                if p.is_dir() {
                    stack.push(p);
                } else if matches!(p.extension().and_then(|x| x.to_str()), Some("md" | "mdx")) {
                    files.extend(std::fs::read(&p).ok());
                }
            }
        }
        if !files.is_empty() {
            return files;
        }
    }
    // 2048 pseudo-documents of 4 KiB.
    let mut x: u64 = 0x9e37_79b9_7f4a_7c15;
    (0..2048)
        .map(|_| {
            (0..4096)
                .map(|_| {
                    x ^= x << 13;
                    x ^= x >> 7;
                    x ^= x << 17;
                    b"abcdefghijklmnopqrstuvwxyz \n#`"[(x % 30) as usize]
                })
                .collect()
        })
        .collect()
}

fn main() {
    let docs = corpus();
    let bytes: usize = docs.iter().map(Vec::len).sum();
    println!("corpus\t{} files\t{:.2} MiB", docs.len(), bytes as f64 / 1048576.0);

    // 1. Change detection in `ay docs sync`: one content hash per document.
    let sip = time(30, || {
        for d in &docs {
            let mut h = DefaultHasher::new();
            h.write(d);
            black_box(h.finish());
        }
    });
    let b3 = time(30, || {
        for d in &docs {
            black_box(blake3::hash(d));
        }
    });
    let wy = time(30, || {
        for d in &docs {
            black_box(Wyhash::hash(0, d));
        }
    });
    row("hash/docs", "std-siphash", sip, wy);
    row("hash/docs", "blake3", b3, wy);

    // 2. Ranking order in `ay docs bun`: sort hits by a u64 key (score bits).
    let n = 200_000u64;
    let hits: Vec<(u64, u32, [u8; 48])> = (0..n).map(|i| ((i.wrapping_mul(0x9e37_79b9_7f4a_7c15)) >> 11, i as u32, [0; 48])).collect();
    let std_sort = time(15, || {
        let mut v = hits.clone();
        v.sort_by_key(|h| h.0);
        black_box(v);
    });
    let bun_sort = time(15, || {
        let mut v = hits.clone();
        v.sort_by_u64(|h| h.0);
        black_box(v);
    });
    row("sort/200k", "slice::sort_by_key", std_sort, bun_sort);

    // 3. Percentiles in `ay time`: p50/p90/p99 of 1M samples (ns).
    let samples: Vec<u64> = (0..1_000_000u64).map(|i| 1_000 + (i.wrapping_mul(2_654_435_761) % 5_000_000)).collect();
    let by_sort = time(10, || {
        let mut v = samples.clone();
        v.sort_unstable();
        black_box([v[v.len() / 2], v[v.len() * 9 / 10], v[v.len() * 99 / 100]]);
    });
    let by_hist = time(10, || {
        let mut h = Histogram::new(1, 3_600_000_000_000, 3).expect("histogram bounds");
        for &s in &samples {
            h.record(s);
        }
        black_box([h.value_at_percentile(50.0), h.value_at_percentile(90.0), h.value_at_percentile(99.0)]);
    });
    row("percentiles/1M", "sort_unstable", by_sort, by_hist);
}
