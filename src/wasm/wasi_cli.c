// SPDX-License-Identifier: MIT OR Apache-2.0
/*
 * src/wasm/wasi_cli.c - Portable WASI Preview 1/2 CLI inspector (`ay-wasm-inspect.wasm`)
 * Compiled with WebAssembly/wasi-sdk 34.0 (`clang --target=wasm32-wasip1`) + optimized via Binaryen `wasm-opt`.
 */
#include <stdio.h>
#include <stdint.h>
#include "../include/ay/sys.h"

int main(int argc, char **argv)
{
	if (argc < 2) {
		printf("ay-wasm-inspect (abi=%u)\nusage: ay-wasm-inspect <file.wasm>\n",
		       ay_sys_abi_version());
		return 0;
	}

	FILE *f = fopen(argv[1], "rb");
	if (!f) {
		fprintf(stderr, "error: cannot open %s\n", argv[1]);
		return 1;
	}

	fseek(f, 0, SEEK_END);
	long sz = ftell(f);
	fseek(f, 0, SEEK_SET);
	if (sz <= 0 || sz > (16 * 1024 * 1024)) {
		fclose(f);
		fprintf(stderr, "error: invalid wasm size %ld\n", sz);
		return 1;
	}

	static uint8_t buf[4 * 1024 * 1024];
	if ((size_t)sz > sizeof(buf)) {
		fclose(f);
		return 1;
	}
	size_t n = fread(buf, 1, (size_t)sz, f);
	fclose(f);

	struct wasm_module_info info;
	if (wasm_inspect_module(buf, n, &info) != AY_OK) {
		fprintf(stderr, "error: malformed wasm binary\n");
		return 2;
	}

	printf("{\"magic\":\"0x%08x\",\"version\":%u,\"sections\":%u,\"code_bytes\":%u,\"total_bytes\":%u}\n",
	       info.magic, info.version, info.section_count, info.code_bytes, info.total_bytes);
	return 0;
}
