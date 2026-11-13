# syntax=docker/dockerfile:1
# cross-windows: build Windows binaries from Linux (docs/linux/CROSS-WINDOWS.md).
#   x86_64/aarch64-w64-windows-gnu: llvm-mingw (clang, lld, mingw-w64 headers and CRT, libc++), official release.
#   x86_64-pc-windows-msvc: clang-cl + lld-link (Arch clang/lld/llvm packages; on fr1 the Chromium LLVM), with the MSVC CRT and Windows SDK fetched
#   by xwin at run time (`xwin --accept-license splat --output /xwin`): Microsoft's files are never baked
#   into a published image (Microsoft licence, not redistributable).
ARG BASE=docker.io/library/archlinux:base-devel@sha256:fa2d4ce3310ddd90a4208e5168be8ad367da5129af1245f38fd2d803bcbe3239
FROM ${BASE}
# github.com/mstorsjo/llvm-mingw release 20261104 (LLVM 23.1.5); digest from the GitHub release API, 2026-11-13.
ARG LLVM_MINGW=20261104
ARG LLVM_MINGW_SHA256=919380403de87dca3c581c2053230cd298af5e891286628ba0613b7fed370926
# github.com/Jake-Shadle/xwin release 0.10.0 (tools.toml pins the same version).
ARG XWIN=0.10.0
ARG XWIN_SHA256=d870eb4b2f390878af6da1ccd3cf321d22fcb72720984853b4be732ae597fc88
RUN pacman -Syu --noconfirm --needed clang lld llvm curl tar xz make cmake ninja git \
 && curl -fsSLo /tmp/llvm-mingw.tar.xz "https://github.com/mstorsjo/llvm-mingw/releases/download/${LLVM_MINGW}/llvm-mingw-${LLVM_MINGW}-ucrt-ubuntu-22.04-x86_64.tar.xz" \
 && echo "${LLVM_MINGW_SHA256}  /tmp/llvm-mingw.tar.xz" | sha256sum -c - \
 && mkdir -p /opt/llvm-mingw && tar -xJf /tmp/llvm-mingw.tar.xz -C /opt/llvm-mingw --strip-components=1 \
 && curl -fsSLo /tmp/xwin.tar.gz "https://github.com/Jake-Shadle/xwin/releases/download/${XWIN}/xwin-${XWIN}-x86_64-unknown-linux-musl.tar.gz" \
 && echo "${XWIN_SHA256}  /tmp/xwin.tar.gz" | sha256sum -c - \
 && tar -xzf /tmp/xwin.tar.gz -C /usr/local/bin --strip-components=1 "xwin-${XWIN}-x86_64-unknown-linux-musl/xwin" \
 && rm -f /tmp/*.tar.* && pacman -Scc --noconfirm && rm -rf /var/cache/pacman/pkg/* /var/lib/pacman/sync/*
COPY msvc.cmake /opt/cross/msvc.cmake
ENV PATH=/opt/llvm-mingw/bin:$PATH
LABEL org.opencontainers.image.title="cross-windows" org.opencontainers.image.licenses="MIT OR Apache-2.0"
