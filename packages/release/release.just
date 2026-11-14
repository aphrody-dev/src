# npm publication without a human (imported by the root justfile).

# npm without a human (docs/infra/NPM.md): status|sync|inventory|align [--write]|login|trust|harden
[group('release')]
npm cmd="status" *args:
    bun run "{{root}}/packages/release/src/npm.ts" {{cmd}} {{args}}

# Weekly timer: npm-publish.yml actions (src, rosegriffon, shenron) pinned back to the latest SHA of their major version, commit on main
[group('release')]
[windows]
npm-pins-schedule:
    schtasks /Create /F /SC WEEKLY /D MON /ST 06:00 /TN aphrody-npm-pins /TR "conhost.exe --headless \"$(bun -e 'process.stdout.write(process.execPath)')\" run \"{{root}}/packages/release/src/npm.ts\" pins --push"

# CI dry-run of npm publication (trusted publishing OIDC, NPM_TOKEN fallback) for package folders
[group('release')]
npm-publish-ci pkgs="packages/wck" dry="true":
    gh workflow run npm-publish.yml -R aphrody-labs/aphrody -f packages="{{pkgs}}" -f dry_run={{dry}}
