CLANG ?= clang
TARGET ?= wasm32
CFLAGS := --target=$(TARGET) -nostdlib -O2 -Wall -Wextra -Werror
LDFLAGS := -Wl,--no-entry -Wl,--export-dynamic

all: ../public/wayland.wasm

../public/wayland.wasm: wayland_compositor.c wayland_wire.h
	$(CLANG) $(CFLAGS) $(LDFLAGS) -o $@ wayland_compositor.c

clean:
	rm -f ../public/wayland.wasm
