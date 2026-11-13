# syntax=docker/dockerfile:1
# base-debian: Debian 13 slim for building and testing the .deb of infra/pkg only (docs/deps/POLICY.md:
# Debian is an output target of `ay pkg`, never a base of src's own toolchain). No recommends, no docs.
ARG BASE=docker.io/library/debian:trixie-slim@sha256:a72b4433de1cf7d6bae0c4cee74d0547f58601a643b3375f070c51600d63b6b2
FROM ${BASE}
COPY dpkg-nodoc.conf /etc/dpkg/dpkg.cfg.d/01-aphrody-nodoc
COPY apt-norecommends.conf /etc/apt/apt.conf.d/01-aphrody-norecommends
RUN apt-get update -q && apt-get upgrade -y -q && apt-get install -y -q ca-certificates \
 && apt-get clean && rm -rf /var/lib/apt/lists/*
LABEL org.opencontainers.image.title="base-debian" org.opencontainers.image.licenses="MIT OR Apache-2.0"
