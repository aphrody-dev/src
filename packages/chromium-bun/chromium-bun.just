# Browser engines (imported by the root justfile).

# Browser, automation and crawl engines (packages/chromium-bun/src/engines): idempotent install, Windows and Linux
# (usage: just browsers, just browsers chrome@beta lightpanda; other subcommands: bun run --cwd packages/chromium-bun src/cli.ts engines)
[group('browser')]
browsers *ids:
    bun run --cwd "{{root}}/packages/chromium-bun" src/cli.ts engines install {{ids}}
