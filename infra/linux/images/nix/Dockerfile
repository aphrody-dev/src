# syntax=docker/dockerfile:1
# base-nix: Nix with flakes enabled, the builder of the nix target of `ay pkg` and of infra/nix.
ARG BASE=docker.io/nixos/nix:2.35.6@sha256:b49cb33f3a7e5cf3933ad8774529de0e3807ec5cf54987aa7ccdfb49f2fc55ed
FROM ${BASE}
RUN printf 'experimental-features = nix-command flakes\nmax-jobs = auto\nsandbox = false\n' >> /etc/nix/nix.conf
LABEL org.opencontainers.image.title="base-nix" org.opencontainers.image.licenses="MIT OR Apache-2.0"
