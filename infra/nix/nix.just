# Nix dev shell (imported by the root justfile).

# Nix alternative to containers: dev shell from infra/nix/flake.nix
[group('docker')]
nix-shell:
    nix develop "{{root}}/infra/nix"
