# Options vérifiées dans nix-community/home-manager (modules/programs/{bash,fish,nushell,carapace,zoxide}.nix, master).
{ pkgs, ... }:
let
  # Copié tel quel dans le store : les chemins relatifs des configs (../env.nu, status dirname) restent valides.
  shells = ../../../packages/machine/shells;
in
{
  home.stateVersion = "25.11";
  programs.home-manager.enable = true;

  home.packages = with pkgs; [
    brush
    eza
    fd
    ripgrep
    just
  ];

  # Famille bash : bashrc partagé (agent A), qui source ../env.sh.
  programs.bash = {
    enable = true;
    bashrcExtra = ''. "${shells}/bash/bashrc"'';
  };

  programs.fish = {
    enable = true;
    shellInit = "source ${shells}/fish/config.fish";
  };
  xdg.configFile."fish/completions/ay.fish".source = "${shells}/completions/ay.fish";

  programs.nushell = {
    loadSessionVariables = false; # env.nu du dépôt pose les variables
    enable = true;
    extraEnv = "source ${shells}/nu/env.nu";
    extraConfig = "source ${shells}/nu/config.nu";
  };

  # Complétion partagée (spec ay + git/cargo/just) ; fish garde ses complétions natives.
  programs.carapace = {
    enable = true;
    enableFishIntegration = false;
  };
  xdg.configFile."carapace/specs/ay.yaml".source = "${shells}/completions/ay.yaml";

  # zoxide : nu via home-manager ; bash et fish l'initialisent depuis leur cache ($AY_SHELL_CACHE).
  programs.zoxide = {
    enable = true;
    enableBashIntegration = false;
    enableFishIntegration = false;
    enableNushellIntegration = true;
  };
}
