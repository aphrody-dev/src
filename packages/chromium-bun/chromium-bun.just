# Browser engines (imported by the root justfile).

# Browser, automation and crawl engines (packages/chromium-bun/src/engines): idempotent install, Windows and Linux
# (usage: just browsers, just browsers chrome@beta lightpanda; other subcommands: bun run --cwd packages/chromium-bun src/cli.ts engines)
[group('browser')]
browsers *ids:
    bun run --cwd "{{root}}/packages/chromium-bun" src/cli.ts engines install {{ids}}

# Chromium ecosystem trackers ([tracker.*] of third_party/ECOSYSTEM.toml): live channel and V8 versions, issue/CL/news/changelog
# links, code graph, README.chromium (usage: just trackers, just trackers refresh --only=node,electron, just trackers check)
[group('browser')]
trackers *args="all":
    bun run --cwd "{{root}}/packages/chromium-bun" src/cli.ts trackers {{args}}
