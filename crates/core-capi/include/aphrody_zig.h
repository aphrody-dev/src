#ifndef APHRODY_ZIG_H
#define APHRODY_ZIG_H

/* Canonical C23/C11/C++23 ABI header for the monorepo Zig cores:
 * - packages/native/native (`libnative_sdk` / `native_sdk_app_*`)
 * - packages/browser (`browser_capi`)
 * Consumed by C, C++23, Rust (`crates/ffi`), and Bun (`bun:ffi`).
 */

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define APHRODY_ABI_VERSION 1u
#define APHRODY_STATUS_OK 0
#define APHRODY_STATUS_ERR 1
#define APHRODY_STATUS_INVALID_ARG (-1)

/* --- Native SDK Zig Core (`native`) --- */
void *native_sdk_app_create(void);
void native_sdk_app_destroy(void *app);

/* --- Lightpanda Browser Zig Core (`browser_capi`) --- */
#define APHRODY_LP_ABI_VERSION 1u
uint32_t lp_abi_version(void);
void lp_free(char *p);
char *lp_capabilities_json(void);
char *lp_extract_title_json(const char *html);
char *lp_normalize_url_json(const char *url);

/* --- Aphrody V8 & CEF Core (`aphrody-v8`, `aphrody-cef`) --- */
#define APHRODY_V8_ABI_VERSION 1u
#define APHRODY_CEF_ABI_VERSION 1u
uint32_t v8_abi_version(void);
void v8_free(char *p);
char *v8_capabilities_json(void);
char *v8_validate_flags_json(const char *params_json);
uint32_t cef_abi_version(void);
void cef_free(char *p);
char *cef_capabilities_json(void);
char *cef_build_args_json(const char *url, const char *settings_json);

#ifdef __cplusplus
}
#endif

#endif /* APHRODY_ZIG_H */
