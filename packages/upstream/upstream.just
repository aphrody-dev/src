# Upstream forks, labs arena and offline docs mirrors (imported by the root justfile).

# Run Vercel & Vercel-Labs benchmark arena
[group('upstream')]
labs cmd="bench":
    bun run "{{root}}/packages/upstream/src/labs-arena/cli.ts" {{cmd}}

# Refresh the local offline docs mirrors (Docker, Kubernetes, Nix, Arch/Alpine images)
[group('upstream')]
docs-sync:
    git -C "{{root}}/third_party/docker-docs" pull --depth 1
    git -C "{{root}}/third_party/kubernetes-website" pull --depth 1
    git -C "{{root}}/third_party/nix-dev" pull --depth 1
    git -C "{{root}}/third_party/archlinux-docker" pull --depth 1
    git -C "{{root}}/third_party/docker-alpine" pull --depth 1
