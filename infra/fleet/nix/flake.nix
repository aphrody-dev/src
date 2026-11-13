# Shells de la flotte Linux via home-manager (standalone) : même environnement que le poste Windows,
# lu depuis packages/machine/shells (env.toml -> env.sh/env.nu/env.fish, configs nu/fish/bash, spec ay).
# Nix n'est installé sur aucun hôte (2026-11-13) ; évalué dans le conteneur nixos/nix sur prd.
# Usage (hôte avec nix, checkout git de src) :
#   nix run home-manager/master -- switch --flake ~/src/infra/fleet/nix#root@prd
{
  description = "aphrody fleet shells (bash, brush, nushell, fish) — home-manager";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    { nixpkgs, home-manager, ... }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      mk =
        username: homeDirectory:
        home-manager.lib.homeManagerConfiguration {
          inherit pkgs;
          modules = [
            ./home.nix
            { home = { inherit username homeDirectory; }; }
          ];
        };
    in
    {
      homeConfigurations = {
        "root@prd" = mk "root" "/root";
        "ubuntu@fr2" = mk "ubuntu" "/home/ubuntu";
        "ubuntu@fr1" = mk "ubuntu" "/home/ubuntu";
      };
    };
}
