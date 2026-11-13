# syntax=docker/dockerfile:1
# base-alpine: Alpine (musl) + CA certificates; base of static and musl images (docs/packaging/CONTAINERS.md).
ARG BASE=docker.io/library/alpine:3.24.4@sha256:f59abe656b692d901e184be3445e084786602108599d2a51d229c0f5a48c71bf
FROM ${BASE}
RUN apk upgrade --no-cache && apk add --no-cache ca-certificates tzdata
LABEL org.opencontainers.image.title="base-alpine" org.opencontainers.image.licenses="MIT OR Apache-2.0"
