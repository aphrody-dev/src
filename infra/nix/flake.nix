{
  # Nix alternative to the containers: `nix develop` (or `just nix-shell`) on NixOS, any Linux, macOS, or WSL2.
  # `nix flake lock` pins nixpkgs in flake.lock; commit it for reproducible shells.
  description = "Aphrody monorepo dev shell (Bun, Rust, Go, just, C/C++ toolchain)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = forAllSystems (pkgs: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            go
            rustup
            just
            git
            git-lfs
            clang
            cmake
            ninja
            pkg-config
            openssl
            python3
            kubectl
            kubernetes-helm
            kind
            hadolint
          ];
          shellHook = ''
            export SRC_ROOT="$PWD"
            export AGENT_GUARD="''${AGENT_GUARD:-off}"
            rustup show active-toolchain >/dev/null 2>&1 || rustup default nightly
          '';
        };
      });
    };
}
