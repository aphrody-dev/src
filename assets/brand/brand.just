# Brand assets (imported by the root justfile).

# Brand assets (assets/brand; stages in crates/aphrody-ui/src/brand/web.rs) built on fr1 from a pushed ref:
# pinned inputs, `ay brand build` twice (both manifest sha256 must match), check.ts; then gen/ copied back here.
[group('assets')]
brand ref="origin/main":
    timeout 3600 ssh vps 'set -e; d=/srv/build/brand; [ -d $d/.git ] || git clone -q --filter=blob:none https://github.com/aphrody-labs/src.git $d; cd $d; git fetch -q origin; git reset -q --hard {{ if ref =~ '^[A-Za-z0-9._/-]+$' { ref } else { error("invalid ref") } }}; export PATH=$HOME/.cargo/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH CARGO_TARGET_DIR=/srv/build/target-brand; bun assets/brand/fetch.ts >/dev/null; cargo build -q -p aphrody-ui --bin aphrody-brand --profile iteration; /srv/build/target-brand/iteration/aphrody-brand build; cp assets/brand/gen/manifest.json.sha256 /tmp/brand-run1.sha256; /srv/build/target-brand/iteration/aphrody-brand build; cmp /tmp/brand-run1.sha256 assets/brand/gen/manifest.json.sha256; bun assets/brand/check.ts'
    rm -rf "{{root}}/assets/brand/gen" && mkdir -p "{{root}}/assets/brand/gen"
    timeout 600 ssh vps 'tar -C /srv/build/brand/assets/brand/gen -cf - .' | tar -C "{{root}}/assets/brand/gen" -xf -

# Publish the gen/ of `just brand` to cdn.aphrody.com/brand/v<version> (immutable, rclone remote r2 on fr1)
[group('assets')]
brand-publish *args:
    timeout 1800 ssh vps 'cd /srv/build/brand && PATH=$HOME/.bun/bin:$HOME/.local/bin:$PATH bun assets/brand/publish.ts {{args}}'
