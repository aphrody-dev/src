/* SPDX-License-Identifier: Apache-2.0 OR MIT */
/* Fused C11 high-speed structural token & line metrics kernel for n2b-polyglot */

#include <stddef.h>
#include <stdint.h>

typedef struct N2bNativeMetrics {
    uint64_t line_count;
    uint64_t brace_open_count;
    uint64_t brace_close_count;
    uint64_t semicolon_count;
    uint64_t fnv1a_hash64;
} N2bNativeMetrics;

void n2b_scan_c_metrics(const uint8_t* buf, size_t len, N2bNativeMetrics* out) {
    if (out == NULL) {
        return;
    }
    uint64_t lines = (len > 0) ? 1 : 0;
    uint64_t b_open = 0;
    uint64_t b_close = 0;
    uint64_t semis = 0;
    uint64_t hash = 14695981039346656037ULL;

    if (buf != NULL) {
        for (size_t i = 0; i < len; ++i) {
            uint8_t c = buf[i];
            hash ^= (uint64_t)c;
            hash *= 1099511628211ULL;
            if (c == '\n') {
                lines++;
            } else if (c == '{') {
                b_open++;
            } else if (c == '}') {
                b_close++;
            } else if (c == ';') {
                semis++;
            }
        }
    }

    out->line_count = lines;
    out->brace_open_count = b_open;
    out->brace_close_count = b_close;
    out->semicolon_count = semis;
    out->fnv1a_hash64 = hash;
}
