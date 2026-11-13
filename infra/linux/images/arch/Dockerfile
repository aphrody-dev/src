# syntax=docker/dockerfile:1
# base-arch-v3: CachyOS x86-64-v3 userland + clang/lld/llvm, makepkg tuned like the CachyOS repositories
# (x86-64-v3, ThinLTO, lld), aligned on the shared LLVM toolchain (docs/llvm/UNIFIED-TOOLCHAIN.md).
ARG BASE=docker.io/cachyos/cachyos-v3:latest@sha256:f8aff6dd7aaedc724f92092223b8ab28a48c186e468e6585dbf8564a0f0b1cae
FROM ${BASE}
COPY makepkg-aphrody.conf /etc/makepkg.conf.d/aphrody.conf
RUN pacman -Syu --noconfirm --needed base-devel clang lld llvm git \
 && pacman -Scc --noconfirm && rm -rf /var/cache/pacman/pkg/* /var/lib/pacman/sync/*
LABEL org.opencontainers.image.title="base-arch-v3" org.opencontainers.image.licenses="MIT OR Apache-2.0"
