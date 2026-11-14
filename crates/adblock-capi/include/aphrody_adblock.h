/* C ABI of crates/adblock-capi (aphrody_adblock shared library). Contract: src/lib.rs.
 * Strings are (pointer, length) UTF-8 pairs, not NUL-terminated. Results are framed buffers:
 *   [uint64 payload length, little endian][uint8 status: 0 ok, 1 error][UTF-8 JSON payload]
 * released with aphrody_adblock_buf_free. */
#ifndef APHRODY_ADBLOCK_H
#define APHRODY_ADBLOCK_H

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct AphrodyAdblockEngine AphrodyAdblockEngine;

uint32_t aphrody_abi_version(void);
void aphrody_free(char *ptr);

/* Compile ABP/uBO rules and hosts lines (newline-delimited). NULL when rules is not UTF-8. */
AphrodyAdblockEngine *aphrody_adblock_new(const uint8_t *rules, size_t rules_len);
void aphrody_adblock_free(AphrodyAdblockEngine *engine);

/* {"matched","blocked","important","filter"?,"exception"?}; empty request_type = "other". */
uint8_t *aphrody_adblock_check_request(const AphrodyAdblockEngine *engine,
                                       const uint8_t *url, size_t url_len,
                                       const uint8_t *source_url, size_t source_url_len,
                                       const uint8_t *request_type, size_t request_type_len);

/* {"hideSelectors":[...],"generichide":bool}; classes/ids separated by ASCII whitespace. */
uint8_t *aphrody_adblock_cosmetic(const AphrodyAdblockEngine *engine,
                                  const uint8_t *page_url, size_t page_url_len,
                                  const uint8_t *classes, size_t classes_len,
                                  const uint8_t *ids, size_t ids_len);

void aphrody_adblock_buf_free(uint8_t *buf);

#ifdef __cplusplus
}
#endif

#endif /* APHRODY_ADBLOCK_H */
