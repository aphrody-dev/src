# SPDX-License-Identifier: MIT OR Apache-2.0
# src/Makefile - Central Pure C, Assembly & WebAssembly Core (`libaysys` / `aysys.dll` / `aysys.wasm` / `wayland.wasm`)
#
# Subsystems:
#   arch/           x86_64, aarch64, wasm32 assembly & CPU entry
#   kernel/         syscalls, freestanding runtime, FNV-1a, CPUID
#   drivers/gpu/    Linux 7.4-rc2 DRM/KMS + Mesa 26.3 GBM/EGL 1.5/D3D12
#   wayland/        Wayland 1.26 wire, XCB 1.17, XWayland 26.0.99 XWM, dynamic tiler
#   nt/             NT Executive / ReactOS NTSTATUS <-> POSIX -errno
#   wine/           wineserver 64-byte fixed request protocol
#   wasm/           WebAssembly 3.0 binary parser, SIMD128 kernels, WASI-SDK 34 CLI, browser Wayland compositor

# make's built-in default CC is `cc`, absent on Windows: only an explicit CC overrides clang.
ifeq ($(origin CC),default)
CC        := clang
endif
WASI_CC   ?= $(HOME)/.local/share/ay/tools/wasi-sdk-34.0-x86_64-windows/bin/clang
WASM_OPT  ?= wasm-opt
WASM_VAL  ?= wasm-validate
OUT_DIR   ?= ../target/sys

CFLAGS_BASE := \
	-std=gnu11 \
	-O3 \
	-funsigned-char \
	-fno-common \
	-fno-strict-aliasing \
	-fintegrated-as \
	-Wall \
	-Wextra \
	-Werror \
	-Iinclude

WASM_FEATURES := -msimd128 -mbulk-memory -mmultivalue -mnontrapping-fptoint -msign-ext

C_SRCS := \
	kernel/sys.c \
	drivers/gpu/drm/drm_mesa.c \
	wayland/wire.c \
	wayland/xwm.c \
	wayland/tiler.c \
	nt/status.c \
	wine/server_proto.c \
	wasm/module.c \
	ui/m3.c \
	ui/shell_kit.c \
	ui/vterm.c

ASM_X86_64 := arch/x86/entry_64.S

.PHONY: all linux windows wasm wasi compositor verify clean

all: wasm compositor verify

linux:
	mkdir -p $(OUT_DIR)
	$(CC) $(CFLAGS_BASE) -fPIC -flto=thin -fuse-ld=lld -shared \
		$(C_SRCS) $(ASM_X86_64) -o $(OUT_DIR)/libaysys.so

windows:
	mkdir -p $(OUT_DIR)
	$(CC) $(CFLAGS_BASE) --target=x86_64-pc-windows-msvc -flto=thin -fuse-ld=lld \
		-nostdlib -Wl,/NOENTRY -Wl,/DLL \
		$(C_SRCS) $(ASM_X86_64) -o $(OUT_DIR)/aysys.dll

wasm:
	mkdir -p $(OUT_DIR)
	$(CC) $(CFLAGS_BASE) $(WASM_FEATURES) --target=wasm32-unknown-unknown -nostdlib \
		-Wl,--no-entry -Wl,--export-dynamic -Wl,--lto-O3 \
		$(C_SRCS) -o $(OUT_DIR)/aysys.raw.wasm
	$(WASM_OPT) -O4 --enable-simd --enable-bulk-memory --enable-multivalue \
		--enable-nontrapping-float-to-int --enable-sign-ext --strip-debug \
		$(OUT_DIR)/aysys.raw.wasm -o $(OUT_DIR)/aysys.wasm
	rm -f $(OUT_DIR)/aysys.raw.wasm

wasi:
	mkdir -p $(OUT_DIR)
	$(WASI_CC) $(CFLAGS_BASE) $(WASM_FEATURES) --target=wasm32-wasip1 \
		$(C_SRCS) wasm/wasi_cli.c -o $(OUT_DIR)/ay-wasm-inspect.raw.wasm
	$(WASM_OPT) -O3 --enable-simd --enable-bulk-memory --enable-multivalue \
		--enable-nontrapping-float-to-int --enable-sign-ext --strip-debug \
		$(OUT_DIR)/ay-wasm-inspect.raw.wasm -o $(OUT_DIR)/ay-wasm-inspect.wasm
	rm -f $(OUT_DIR)/ay-wasm-inspect.raw.wasm
	$(WASI_CC) $(CFLAGS_BASE) $(WASM_FEATURES) --target=wasm32-wasip1 \
		$(C_SRCS) ui/site_wasi.c -o $(OUT_DIR)/ay-m3-site.raw.wasm
	$(WASM_OPT) -O3 --enable-simd --enable-bulk-memory --enable-multivalue \
		--enable-nontrapping-float-to-int --enable-sign-ext --strip-debug \
		$(OUT_DIR)/ay-m3-site.raw.wasm -o $(OUT_DIR)/ay-m3-site.wasm
	rm -f $(OUT_DIR)/ay-m3-site.raw.wasm

compositor:
	mkdir -p $(OUT_DIR)
	$(CC) -std=gnu11 -O3 $(WASM_FEATURES) --target=wasm32-unknown-unknown -nostdlib \
		-Wall -Wextra -Werror -Wl,--no-entry -Wl,--export-dynamic -Wl,--lto-O3 \
		wasm/compositor.c -o $(OUT_DIR)/wayland.raw.wasm
	$(WASM_OPT) -O4 --enable-simd --enable-bulk-memory --enable-multivalue \
		--enable-nontrapping-float-to-int --enable-sign-ext --strip-debug \
		$(OUT_DIR)/wayland.raw.wasm -o ../apps/aphrody/public/wayland.wasm
	rm -f $(OUT_DIR)/wayland.raw.wasm

verify:
	$(WASM_VAL) --enable-all $(OUT_DIR)/aysys.wasm
	$(WASM_VAL) --enable-all $(OUT_DIR)/ay-wasm-inspect.wasm
	$(WASM_VAL) --enable-all $(OUT_DIR)/ay-m3-site.wasm
	$(WASM_VAL) --enable-all ../apps/aphrody/public/wayland.wasm

clean:
	rm -rf $(OUT_DIR)
