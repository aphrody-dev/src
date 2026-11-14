#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0 OR MIT
"""
`rea_ghidra_uv.py`: Zero-overhead `uv run` Python `ctypes` bridge to `n2b_ffi.dll`.
Replaces legacy REA Hopper/LLDB/Pwndbg/Ghidra Python glue with direct in-process Rust SRE calls.
"""

from __future__ import annotations

import ctypes
import json
import pathlib
import sys


def resolve_dll() -> pathlib.Path:
    candidates = [
        pathlib.Path("C:/src/n2b/target/release/n2b_ffi.dll"),
        pathlib.Path("C:/src/n2b/target/debug/n2b_ffi.dll"),
    ]
    for c in candidates:
        if c.exists():
            return c
    raise FileNotFoundError("n2b_ffi.dll not found; build with `cargo build --release` in C:/src/n2b")


class ReaGhidraNative:
    def __init__(self, dll_path: pathlib.Path | None = None) -> None:
        self.dll_path = dll_path or resolve_dll()
        self._lib = ctypes.CDLL(str(self.dll_path))

        self._lib.n2b_abi_version.argtypes = []
        self._lib.n2b_abi_version.restype = ctypes.c_uint32

        self._lib.n2b_ghidra_decompile_json.argtypes = [ctypes.c_char_p, ctypes.c_size_t]
        self._lib.n2b_ghidra_decompile_json.restype = ctypes.c_void_p

        self._lib.n2b_scan_json.argtypes = [ctypes.c_char_p, ctypes.c_size_t]
        self._lib.n2b_scan_json.restype = ctypes.c_void_p

        self._lib.n2b_free_string.argtypes = [ctypes.c_void_p]
        self._lib.n2b_free_string.restype = None

    def abi_version(self) -> str:
        v = self._lib.n2b_abi_version()
        return f"0x{v:08x}"

    def decompile(self, binary_path: str, max_functions: int = 6) -> dict:
        ptr = self._lib.n2b_ghidra_decompile_json(binary_path.encode("utf-8"), max_functions)
        if not ptr:
            raise RuntimeError("n2b_ghidra_decompile_json returned NULL")
        try:
            raw = ctypes.cast(ptr, ctypes.c_char_p).value
            return json.loads(raw.decode("utf-8") if raw else "{}")
        finally:
            self._lib.n2b_free_string(ptr)

    def scan(self, root_path: str, max_files: int = 10000) -> dict:
        ptr = self._lib.n2b_scan_json(root_path.encode("utf-8"), max_files)
        if not ptr:
            raise RuntimeError("n2b_scan_json returned NULL")
        try:
            raw = ctypes.cast(ptr, ctypes.c_char_p).value
            return json.loads(raw.decode("utf-8") if raw else "{}")
        finally:
            self._lib.n2b_free_string(ptr)


def main() -> None:
    native = ReaGhidraNative()
    cmd = sys.argv[1] if len(sys.argv) > 1 else "abi"
    if cmd == "abi":
        print(json.dumps({
            "bridge": "uv-python-ctypes",
            "python": sys.version.split()[0],
            "abiVersion": native.abi_version(),
            "dll": str(native.dll_path).replace("\\", "/"),
        }))
    elif cmd == "decompile" and len(sys.argv) >= 3:
        limit = int(sys.argv[3]) if len(sys.argv) >= 4 else 4
        print(json.dumps(native.decompile(sys.argv[2], limit), indent=2))
    elif cmd == "scan" and len(sys.argv) >= 3:
        limit = int(sys.argv[3]) if len(sys.argv) >= 4 else 5000
        print(json.dumps(native.scan(sys.argv[2], limit), indent=2))
    else:
        raise SystemExit("Usage: uv run rea_ghidra_uv.py <abi|decompile|scan> [target] [limit]")


if __name__ == "__main__":
    main()
