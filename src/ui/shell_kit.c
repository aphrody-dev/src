// SPDX-License-Identifier: MIT OR Apache-2.0
/*
 * src/ui/shell_kit.c - Freestanding Pure C (`-std=gnu11`) Terminal Palette Engine & 2026 Shell/CLI/TUI Index
 *
 * Zero libc dependencies: compiles directly to `aysys.dll`, `libaysys.so`, `aysys.wasm`, and WASI.
 * Provides:
 *   1. Curated terminal color palettes (Aphrody M3 Light/Dark, Catppuccin Mocha/Latte, Tokyo Night,
 *      Nord, Gruvbox Dark, Hyprland Cyan, CachyOS Emerald) matching `packages/design/tokens/ansi.json`.
 *   2. Zero-alloc SGR truecolor escape formatter (`\x1b[...;38;2;R;G;B;48;2;R;G;Bm`) and `#RRGGBB` formatter.
 *   3. Sorted O(log N) binary-search catalog of 2026 modern shells, prompts, terminals, CLIs, TUIs,
 *      Nerd Fonts, icon packs, and themes with upstream repo, official docs URL, and repo config path.
 */

#include "../include/ay/sys.h"

struct sk_palette_entry {
	const char *slug;
	const char *name;
	struct ay_term_palette palette;
};

static const struct sk_palette_entry g_palettes[] = {
	{
		"aphrody-m3-dark",
		"Aphrody M3 Dark",
		{
			.bg = 0xFF0C141Bu,
			.fg = 0xFFDBE3EDu,
			.cursor_bg = 0xFF8BCEFFu,
			.cursor_fg = 0xFF0C141Bu,
			.selection_bg = 0xFF004B6Fu,
			.selection_fg = 0xFFC9E6FFu,
			.accent = 0xFF8BCEFFu,
			.is_dark = 1u,
			.ansi = {
				0xFF2D363Du, 0xFFFFB4ABu, 0xFFBAC4FAu, 0xFFD1D293u,
				0xFF8BCEFFu, 0xFFB4C7E9u, 0xFF9FA8DDu, 0xFFBCC8D3u,
				0xFF87929Du, 0xFFFF897Du, 0xFFDDE1FFu, 0xFFD1D293u,
				0xFFC9E6FFu, 0xFFD5E3FFu, 0xFFF0EFFFu, 0xFFDBE3EDu,
			},
		},
	},
	{
		"aphrody-m3-light",
		"Aphrody M3 Light",
		{
			.bg = 0xFFF6FAFFu,
			.fg = 0xFF141D23u,
			.cursor_bg = 0xFF006492u,
			.cursor_fg = 0xFFFFFFFFu,
			.selection_bg = 0xFFC9E6FFu,
			.selection_fg = 0xFF004B6Fu,
			.accent = 0xFF006492u,
			.is_dark = 0u,
			.ansi = {
				0xFFDBE3EDu, 0xFFBA1A1Au, 0xFF525C8Bu, 0xFFD1D293u,
				0xFF006492u, 0xFF4D5F7Cu, 0xFF6B74A5u, 0xFF3D4851u,
				0xFF6D7883u, 0xFFDE3730u, 0xFF848EC1u, 0xFFD1D293u,
				0xFF0099DCu, 0xFF7F92B1u, 0xFF9FA8DDu, 0xFF141D23u,
			},
		},
	},
	{
		"catppuccin-mocha",
		"Catppuccin Mocha",
		{
			.bg = 0xFF1E1E2Eu,
			.fg = 0xFFCDD6F4u,
			.cursor_bg = 0xFFF5E0DCu,
			.cursor_fg = 0xFF1E1E2Eu,
			.selection_bg = 0xFF45475Au,
			.selection_fg = 0xFFCDD6F4u,
			.accent = 0xFF89B4FAu,
			.is_dark = 1u,
			.ansi = {
				0xFF45475Au, 0xFFF38BA8u, 0xFFA6E3A1u, 0xFFF9E2AFu,
				0xFF89B4FAu, 0xFFF5C2E7u, 0xFF94E2D5u, 0xFFBAC2DEu,
				0xFF585B70u, 0xFFF38BA8u, 0xFFA6E3A1u, 0xFFF9E2AFu,
				0xFF89B4FAu, 0xFFF5C2E7u, 0xFF94E2D5u, 0xFFA6ADC8u,
			},
		},
	},
	{
		"catppuccin-latte",
		"Catppuccin Latte",
		{
			.bg = 0xFFEFF1F5u,
			.fg = 0xFF4C4F69u,
			.cursor_bg = 0xFFDC8A78u,
			.cursor_fg = 0xFFEFF1F5u,
			.selection_bg = 0xFFACB0BEu,
			.selection_fg = 0xFF4C4F69u,
			.accent = 0xFF1E66F5u,
			.is_dark = 0u,
			.ansi = {
				0xFF5C5F77u, 0xFFD20F39u, 0xFF40A02Bu, 0xFFDF8E1Du,
				0xFF1E66F5u, 0xFFEA76CBu, 0xFF179299u, 0xFFACB0BEu,
				0xFF6C6F85u, 0xFFD20F39u, 0xFF40A02Bu, 0xFFDF8E1Du,
				0xFF1E66F5u, 0xFFEA76CBu, 0xFF179299u, 0xFFBCC0CCu,
			},
		},
	},
	{
		"tokyo-night",
		"Tokyo Night",
		{
			.bg = 0xFF1A1B26u,
			.fg = 0xFFC0CAF5u,
			.cursor_bg = 0xFFC0CAF5u,
			.cursor_fg = 0xFF1A1B26u,
			.selection_bg = 0xFF283457u,
			.selection_fg = 0xFFC0CAF5u,
			.accent = 0xFF7AA2F7u,
			.is_dark = 1u,
			.ansi = {
				0xFF15161Eu, 0xFFF7768Eu, 0xFF9ECE6Au, 0xFFE0AF68u,
				0xFF7AA2F7u, 0xFFBB9AF7u, 0xFF7DCFFFu, 0xFFA9B1D6u,
				0xFF414868u, 0xFFF7768Eu, 0xFF9ECE6Au, 0xFFE0AF68u,
				0xFF7AA2F7u, 0xFFBB9AF7u, 0xFF7DCFFFu, 0xFFC0CAF5u,
			},
		},
	},
	{
		"nord",
		"Nord",
		{
			.bg = 0xFF2E3440u,
			.fg = 0xFFD8DEE9u,
			.cursor_bg = 0xFFD8DEE9u,
			.cursor_fg = 0xFF2E3440u,
			.selection_bg = 0xFF434C5Eu,
			.selection_fg = 0xFFECEFF4u,
			.accent = 0xFF88C0D0u,
			.is_dark = 1u,
			.ansi = {
				0xFF3B4252u, 0xFFBF616Au, 0xFFA3BE8Cu, 0xFFEBCB8Bu,
				0xFF81A1C1u, 0xFFB48EADu, 0xFF88C0D0u, 0xFFE5E9F0u,
				0xFF4C566Au, 0xFFBF616Au, 0xFFA3BE8Cu, 0xFFEBCB8Bu,
				0xFF81A1C1u, 0xFFB48EADu, 0xFF8FBCBBu, 0xFFECEFF4u,
			},
		},
	},
	{
		"gruvbox-dark",
		"Gruvbox Dark",
		{
			.bg = 0xFF282828u,
			.fg = 0xFFEBDBB2u,
			.cursor_bg = 0xFFEBDBB2u,
			.cursor_fg = 0xFF282828u,
			.selection_bg = 0xFF504945u,
			.selection_fg = 0xFFFBF1C7u,
			.accent = 0xFFFE8019u,
			.is_dark = 1u,
			.ansi = {
				0xFF282828u, 0xFFCC241Du, 0xFF98971Au, 0xFFD79921u,
				0xFF458588u, 0xFFB16286u, 0xFF689D6Au, 0xFFA89984u,
				0xFF928374u, 0xFFFB4934u, 0xFFB8BB26u, 0xFFFABD2Fu,
				0xFF83A598u, 0xFFD3869Bu, 0xFF8EC07Cu, 0xFFEBDBB2u,
			},
		},
	},
	{
		"hyprland-cyan",
		"Hyprland Cyan",
		{
			.bg = 0xFF0E141Bu,
			.fg = 0xFFE2F1F8u,
			.cursor_bg = 0xFF33CCFFu,
			.cursor_fg = 0xFF0E141Bu,
			.selection_bg = 0xFF1B3A4Bu,
			.selection_fg = 0xFFE2F1F8u,
			.accent = 0xFF33CCFFu,
			.is_dark = 1u,
			.ansi = {
				0xFF1A242Fu, 0xFFFF5E7Eu, 0xFF00FF99u, 0xFFFFD166u,
				0xFF33CCFFu, 0xFFC792EAu, 0xFF00E5FFu, 0xFFC5DCE8u,
				0xFF546E7Au, 0xFFFF7A95u, 0xFF55FFB8u, 0xFFFFE082u,
				0xFF66DBFFu, 0xFFD7B2F2u, 0xFF66F0FFu, 0xFFFFFFFFu,
			},
		},
	},
	{
		"cachyos-emerald",
		"CachyOS Emerald",
		{
			.bg = 0xFF101820u,
			.fg = 0xFFDDEEE8u,
			.cursor_bg = 0xFF00AA88u,
			.cursor_fg = 0xFF101820u,
			.selection_bg = 0xFF0D443Au,
			.selection_fg = 0xFFDDEEE8u,
			.accent = 0xFF00AA88u,
			.is_dark = 1u,
			.ansi = {
				0xFF1B2733u, 0xFFFF6B6Bu, 0xFF00CC99u, 0xFFF4D35Eu,
				0xFF38A3A5u, 0xFFB892FFu, 0xFF00AA88u, 0xFFC8DCD6u,
				0xFF52667Au, 0xFFFF8585u, 0xFF33E6B8u, 0xFFF7DF88u,
				0xFF57C4C7u, 0xFFCDB3FFu, 0xFF33CCADu, 0xFFF0FAF6u,
			},
		},
	},
};

#define PALETTE_COUNT ((__u32)(sizeof(g_palettes) / sizeof(g_palettes[0])))

struct sk_catalog_entry {
	__u32 category;
	__u32 source;
	__u32 platforms;
	const char *slug;
	const char *name;
	const char *version;
	const char *repo;
	const char *docs;
	const char *config;
	const char *binary;
};

/* Strictly sorted ascending in ASCII by `.slug` for O(log N) binary search. */
static const struct sk_catalog_entry g_catalog[] = {
	{ AY_SHELL_CAT_TERMINAL, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_ALL,
	  "alacritty", "Alacritty", "0.16.1", "alacritty/alacritty",
	  "https://alacritty.org/config-alacritty.html",
	  "packages/machine/shells/alacritty/alacritty.toml", "alacritty" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_BUILTIN, AY_SHELL_PLAT_ALL,
	  "aphrody-m3-dark", "Aphrody M3 Dark", "2026.11", "aphrody-dev/src",
	  "https://m3.material.io/styles/color/roles",
	  "packages/design/tokens/ansi.json", "" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_BUILTIN, AY_SHELL_PLAT_ALL,
	  "aphrody-m3-light", "Aphrody M3 Light", "2026.11", "aphrody-dev/src",
	  "https://m3.material.io/styles/color/roles",
	  "packages/design/tokens/ansi.json", "" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "atuin", "Atuin", "18.24.8", "atuinsh/atuin",
	  "https://docs.atuin.sh/configuration/config/",
	  "packages/machine/shells/atuin/config.toml", "atuin" },
	{ AY_SHELL_CAT_SHELL, AY_SHELL_SRC_BUILTIN, AY_SHELL_PLAT_ALL,
	  "bash", "GNU / Git Bash", "5.2", "mirror/bash",
	  "https://www.gnu.org/software/bash/manual/",
	  "packages/machine/shells/bash/bashrc", "bash" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "bat", "bat", "0.26.1", "sharkdp/bat",
	  "https://github.com/sharkdp/bat#configuration-file",
	  "packages/machine/shells/bat/config", "bat" },
	{ AY_SHELL_CAT_TUI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "bottom", "bottom (btm)", "0.15.0", "ClementTsang/bottom",
	  "https://clementtsang.github.io/bottom/stable/configuration/config-file/",
	  "packages/machine/shells/bottom/bottom.toml", "btm" },
	{ AY_SHELL_CAT_SHELL, AY_SHELL_SRC_CARGO, AY_SHELL_PLAT_ALL,
	  "brush", "Brush (Rust bash)", "0.3", "reubeno/brush",
	  "https://github.com/reubeno/brush",
	  "packages/machine/shells/bash/bashrc", "brush" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "cachyos-emerald", "CachyOS Emerald", "2026.11", "CachyOS/cachyos-zsh-config",
	  "https://wiki.cachyos.org/",
	  "packages/design/src/themes.ts", "" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_BUILTIN, AY_SHELL_PLAT_ALL,
	  "carapace", "Carapace", "1.8.2", "carapace-sh/carapace-bin",
	  "https://carapace-sh.github.io/carapace-bin/",
	  "packages/machine/shells/nu/config.nu", "carapace" },
	{ AY_SHELL_CAT_FONT, AY_SHELL_SRC_NERD_FONTS, AY_SHELL_PLAT_ALL,
	  "cascadia-code-nf", "CaskaydiaCove Nerd Font", "3.5.1", "ryanoasis/nerd-fonts",
	  "https://www.nerdfonts.com/font-downloads",
	  "packages/machine/shells/fonts/fonts.lock.toml", "" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "catppuccin-latte", "Catppuccin Latte", "1.7.1", "catppuccin/catppuccin",
	  "https://catppuccin.com/palette/",
	  "packages/machine/shells/git/delta.gitconfig", "" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "catppuccin-mocha", "Catppuccin Mocha", "1.7.1", "catppuccin/catppuccin",
	  "https://catppuccin.com/palette/",
	  "packages/machine/shells/eza/theme.yml", "" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "delta", "git-delta", "0.20.1", "dandavison/delta",
	  "https://dandavison.github.io/delta/configuration.html",
	  "packages/machine/shells/git/delta.gitconfig", "delta" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "eza", "eza", "0.23.5", "eza-community/eza",
	  "https://eza.rocks/",
	  "packages/machine/shells/eza/theme.yml", "eza" },
	{ AY_SHELL_CAT_ICON, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "eza-themes", "eza-themes (Catppuccin Mocha)", "2026.11", "eza-community/eza-themes",
	  "https://github.com/eza-community/eza-themes",
	  "packages/machine/shells/eza/theme.yml", "eza" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "fastfetch", "Fastfetch", "2.71.0", "fastfetch-cli/fastfetch",
	  "https://github.com/fastfetch-cli/fastfetch/wiki/Configuration",
	  "packages/machine/shells/fastfetch/config.jsonc", "fastfetch" },
	{ AY_SHELL_CAT_SHELL, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_ALL,
	  "fish", "Fish Shell", "4.0", "fish-shell/fish-shell",
	  "https://fishshell.com/docs/current/",
	  "packages/machine/shells/fish/config.fish", "fish" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_BUILTIN, AY_SHELL_PLAT_ALL,
	  "fzf", "fzf", "0.75.0", "junegunn/fzf",
	  "https://junegunn.github.io/fzf/",
	  "packages/machine/shells/bash/bashrc", "fzf" },
	{ AY_SHELL_CAT_TERMINAL, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_LINUX | AY_SHELL_PLAT_MACOS,
	  "ghostty", "Ghostty", "1.2", "ghostty-org/ghostty",
	  "https://ghostty.org/docs/config/reference",
	  "packages/machine/shells/ghostty/config", "ghostty" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "glow", "Glow", "3.0.0", "charmbracelet/glow",
	  "https://github.com/charmbracelet/glow#readme",
	  "packages/machine/shells/manifest.toml", "glow" },
	{ AY_SHELL_CAT_FONT, AY_SHELL_SRC_NERD_FONTS, AY_SHELL_PLAT_ALL,
	  "google-sans-code", "Google Sans Code", "2026", "google/fonts",
	  "https://fonts.google.com/specimen/Google+Sans+Code",
	  "packages/machine/shells/fonts/fonts.lock.toml", "" },
	{ AY_SHELL_CAT_FONT, AY_SHELL_SRC_NERD_FONTS, AY_SHELL_PLAT_ALL,
	  "google-sans-flex", "Google Sans Flex", "2026", "google/fonts",
	  "https://fonts.google.com/specimen/Google+Sans+Flex",
	  "packages/machine/shells/fonts/fonts.lock.toml", "" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "gruvbox-dark", "Gruvbox Dark", "2026.11", "morhetz/gruvbox",
	  "https://github.com/morhetz/gruvbox",
	  "packages/design/src/themes.ts", "" },
	{ AY_SHELL_CAT_TUI, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_ALL,
	  "helix", "Helix Editor", "25.07.1", "helix-editor/helix",
	  "https://docs.helix-editor.com/configuration.html",
	  "packages/machine/shells/helix/config.toml", "hx" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "hyprland-cyan", "Hyprland Cyan", "2026.11", "hyprwm/Hyprland",
	  "https://wiki.hypr.land/",
	  "packages/design/src/themes.ts", "" },
	{ AY_SHELL_CAT_FONT, AY_SHELL_SRC_NERD_FONTS, AY_SHELL_PLAT_ALL,
	  "jetbrains-mono-nf", "JetBrainsMono Nerd Font", "3.5.1", "ryanoasis/nerd-fonts",
	  "https://www.nerdfonts.com/font-downloads",
	  "packages/machine/shells/fonts/fonts.lock.toml", "" },
	{ AY_SHELL_CAT_TUI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "lazygit", "Lazygit", "0.66.3", "jesseduffield/lazygit",
	  "https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md",
	  "packages/machine/shells/lazygit/config.yml", "lazygit" },
	{ AY_SHELL_CAT_FONT, AY_SHELL_SRC_BUILTIN, AY_SHELL_PLAT_ALL,
	  "material-symbols", "Material Symbols", "2026", "google/material-design-icons",
	  "https://fonts.google.com/icons",
	  "packages/machine/shells/fonts/fonts.lock.toml", "" },
	{ AY_SHELL_CAT_ICON, AY_SHELL_SRC_NERD_FONTS, AY_SHELL_PLAT_ALL,
	  "nerd-font-icons", "Nerd Fonts v3 Glyphs", "3.5.1", "ryanoasis/nerd-fonts",
	  "https://www.nerdfonts.com/cheat-sheet",
	  "packages/machine/shells/fonts/fonts.lock.toml", "" },
	{ AY_SHELL_CAT_FONT, AY_SHELL_SRC_NERD_FONTS, AY_SHELL_PLAT_ALL,
	  "nerd-fonts-symbols", "Symbols Nerd Font Mono", "3.5.1", "ryanoasis/nerd-fonts",
	  "https://www.nerdfonts.com/cheat-sheet",
	  "packages/machine/shells/fonts/fonts.lock.toml", "" },
	{ AY_SHELL_CAT_SHELL, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_WIN,
	  "niubash", "Niubash", "1.5.0", "unixwin/niubash",
	  "https://github.com/unixwin/niubash",
	  "packages/machine/shells/bash/niubashrc", "niu" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "nord", "Nord", "2026.11", "nordtheme/nord",
	  "https://www.nordtheme.com/docs",
	  "packages/design/src/themes.ts", "" },
	{ AY_SHELL_CAT_SHELL, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_ALL,
	  "nu", "Nushell", "0.117", "nushell/nushell",
	  "https://www.nushell.sh/book/configuration.html",
	  "packages/machine/shells/nu/config.nu", "nu" },
	{ AY_SHELL_CAT_SHELL, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_ALL,
	  "pwsh", "PowerShell 7 (wsh)", "7.7", "PowerShell/PowerShell",
	  "https://learn.microsoft.com/powershell/scripting/overview",
	  "packages/machine/shells/pwsh/profile.ps1", "pwsh" },
	{ AY_SHELL_CAT_PROMPT, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "starship", "Starship Prompt", "1.27.0", "starship/starship",
	  "https://starship.rs/config/",
	  "packages/machine/shells/starship/starship.toml", "starship" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "tealdeer", "tealdeer (tldr)", "1.9.1", "tealdeer-rs/tealdeer",
	  "https://tealdeer-rs.github.io/tealdeer/",
	  "packages/machine/shells/manifest.toml", "tldr" },
	{ AY_SHELL_CAT_TUI, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_ALL,
	  "tmux", "tmux", "3.6", "tmux/tmux",
	  "https://github.com/tmux/tmux/wiki",
	  "packages/machine/shells/tmux/tmux.conf", "tmux" },
	{ AY_SHELL_CAT_THEME, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "tokyo-night", "Tokyo Night", "2026.11", "folke/tokyonight.nvim",
	  "https://github.com/folke/tokyonight.nvim",
	  "packages/design/src/themes.ts", "" },
	{ AY_SHELL_CAT_TERMINAL, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_ALL,
	  "wezterm", "WezTerm", "2026", "wezterm/wezterm",
	  "https://wezterm.org/config/files.html",
	  "packages/machine/shells/wezterm/wezterm.lua", "wezterm" },
	{ AY_SHELL_CAT_TERMINAL, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_WIN,
	  "windows-terminal", "Windows Terminal", "1.24", "microsoft/terminal",
	  "https://learn.microsoft.com/windows/terminal/customize-settings/startup",
	  "packages/machine/src/shells.ts", "wt" },
	{ AY_SHELL_CAT_TUI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "yazi", "Yazi File Manager", "26.9.1", "sxyazi/yazi",
	  "https://yazi-rs.github.io/docs/configuration/overview",
	  "packages/machine/shells/yazi/yazi.toml", "yazi" },
	{ AY_SHELL_CAT_ICON, AY_SHELL_SRC_THEME_PACK, AY_SHELL_PLAT_ALL,
	  "yazi-flavors", "Yazi Flavors", "2026", "yazi-rs/flavors",
	  "https://github.com/yazi-rs/flavors",
	  "packages/machine/shells/yazi/theme.toml", "yazi" },
	{ AY_SHELL_CAT_CLI, AY_SHELL_SRC_TOOLS_TOML, AY_SHELL_PLAT_ALL,
	  "zoxide", "zoxide", "0.10.0", "ajeetdsouza/zoxide",
	  "https://github.com/ajeetdsouza/zoxide#readme",
	  "packages/machine/shells/bash/bashrc", "zoxide" },
	{ AY_SHELL_CAT_SHELL, AY_SHELL_SRC_PKG_MGR, AY_SHELL_PLAT_LINUX | AY_SHELL_PLAT_MACOS,
	  "zsh", "Zsh + Sheldon/Antidote", "5.9", "zsh-users/zsh",
	  "https://zsh.sourceforge.io/Doc/",
	  "packages/machine/shells/zsh/zshrc", "zsh" },
};

#define CATALOG_COUNT ((__u32)(sizeof(g_catalog) / sizeof(g_catalog[0])))

static inline char sk_tolower(char c)
{
	return (c >= 'A' && c <= 'Z') ? (char)(c + ('a' - 'A')) : c;
}

static inline __usize sk_strlen(const char *s)
{
	__usize n = 0;
	const volatile char *p = (const volatile char *)s;
	if (!p)
		return 0;
	while (p[n] != '\0')
		n++;
	return n;
}

static __s32 sk_copy_cstr(const char *src, char *dst, __usize cap)
{
	__usize len = sk_strlen(src);
	__usize i;
	if (!dst || cap == 0)
		return -AY_EINVAL;
	if (len + 1 > cap)
		return -AY_ENOSPC;
	for (i = 0; i < len; i++)
		dst[i] = src[i];
	dst[len] = '\0';
	return (__s32)len;
}

static __s32 sk_cmp_ci(const char *a, __usize alen, const char *b)
{
	__usize i = 0;
	__usize blen = sk_strlen(b);
	__usize n = alen < blen ? alen : blen;
	for (i = 0; i < n; i++) {
		__u8 ca = (__u8)sk_tolower(a[i]);
		__u8 cb = (__u8)sk_tolower(b[i]);
		if (ca != cb)
			return (ca < cb) ? -1 : 1;
	}
	if (alen == blen)
		return 0;
	return (alen < blen) ? -1 : 1;
}

static __s32 sk_contains_ci(const char *hay, const char *needle, __usize nlen)
{
	__usize hlen;
	__usize i;
	__usize j;
	if (nlen == 0)
		return 1;
	if (!hay || !needle)
		return 0;
	hlen = sk_strlen(hay);
	if (nlen > hlen)
		return 0;
	for (i = 0; i + nlen <= hlen; i++) {
		__s32 ok = 1;
		for (j = 0; j < nlen; j++) {
			if (sk_tolower(hay[i + j]) != sk_tolower(needle[j])) {
				ok = 0;
				break;
			}
		}
		if (ok)
			return 1;
	}
	return 0;
}

static __u64 sk_fnv1a(const char *s)
{
	__u64 h = 0xCBF29CE484222325ULL;
	if (!s)
		return h;
	while (*s != '\0') {
		h ^= (__u8)(*s++);
		h *= 0x100000001B3ULL;
	}
	return h;
}

static __usize sk_write_u8_dec(char *dst, __usize pos, __usize cap, __u32 v)
{
	char tmp[3];
	__usize n = 0;
	__usize i;
	if (v == 0) {
		if (pos < cap)
			dst[pos] = '0';
		return pos + 1;
	}
	while (v > 0 && n < 3) {
		tmp[n++] = (char)('0' + (v % 10u));
		v /= 10u;
	}
	for (i = 0; i < n; i++) {
		if (pos < cap)
			dst[pos] = tmp[n - 1 - i];
		pos++;
	}
	return pos;
}

static __usize sk_write_lit(char *dst, __usize pos, __usize cap, const char *lit)
{
	while (*lit != '\0') {
		if (pos < cap)
			dst[pos] = *lit;
		pos++;
		lit++;
	}
	return pos;
}

AY_API __u32 ay_shell_abi_version(void)
{
	return AY_SHELL_ABI_VERSION;
}

AY_API __u32 ay_term_theme_count(void)
{
	return PALETTE_COUNT;
}

AY_API __s32 ay_term_theme_slug(__u32 theme_idx, char *dst, __usize cap)
{
	if (theme_idx >= PALETTE_COUNT)
		return -AY_ENOENT;
	return sk_copy_cstr(g_palettes[theme_idx].slug, dst, cap);
}

AY_API __s32 ay_term_theme_name(__u32 theme_idx, char *dst, __usize cap)
{
	if (theme_idx >= PALETTE_COUNT)
		return -AY_ENOENT;
	return sk_copy_cstr(g_palettes[theme_idx].name, dst, cap);
}

AY_API __s32 ay_term_theme_find(const char *slug, __usize len)
{
	__u32 i;
	if (!slug || len == 0)
		return -AY_EINVAL;
	for (i = 0; i < PALETTE_COUNT; i++) {
		if (sk_cmp_ci(slug, len, g_palettes[i].slug) == 0)
			return (__s32)i;
	}
	return -AY_ENOENT;
}

AY_API __s32 ay_term_palette_get(__u32 theme_idx, struct ay_term_palette *out)
{
	__u32 i;
	const struct ay_term_palette *src;
	if (theme_idx >= PALETTE_COUNT || !out)
		return -AY_EINVAL;
	src = &g_palettes[theme_idx].palette;
	out->bg = src->bg;
	out->fg = src->fg;
	out->cursor_bg = src->cursor_bg;
	out->cursor_fg = src->cursor_fg;
	out->selection_bg = src->selection_bg;
	out->selection_fg = src->selection_fg;
	out->accent = src->accent;
	out->is_dark = src->is_dark;
	for (i = 0; i < 16u; i++)
		out->ansi[i] = src->ansi[i];
	return 0;
}

AY_API __u32 ay_term_palette_argb(__u32 theme_idx, __u32 slot)
{
	const struct ay_term_palette *p;
	if (theme_idx >= PALETTE_COUNT || slot >= AY_TERM_SLOT_COUNT)
		return 0u;
	p = &g_palettes[theme_idx].palette;
	if (slot <= AY_TERM_SLOT_ANSI15)
		return p->ansi[slot];
	switch (slot) {
	case AY_TERM_SLOT_BG: return p->bg;
	case AY_TERM_SLOT_FG: return p->fg;
	case AY_TERM_SLOT_CURSOR_BG: return p->cursor_bg;
	case AY_TERM_SLOT_CURSOR_FG: return p->cursor_fg;
	case AY_TERM_SLOT_SELECTION_BG: return p->selection_bg;
	case AY_TERM_SLOT_SELECTION_FG: return p->selection_fg;
	case AY_TERM_SLOT_ACCENT: return p->accent;
	case AY_TERM_SLOT_IS_DARK: return p->is_dark;
	default: return 0u;
	}
}

AY_API __s32 ay_term_format_hex(__u32 argb, char *dst, __usize cap)
{
	static const char hex[] = "0123456789ABCDEF";
	if (!dst || cap < 8u)
		return -AY_ENOSPC;
	dst[0] = '#';
	dst[1] = hex[(argb >> 20) & 0xFu];
	dst[2] = hex[(argb >> 16) & 0xFu];
	dst[3] = hex[(argb >> 12) & 0xFu];
	dst[4] = hex[(argb >> 8) & 0xFu];
	dst[5] = hex[(argb >> 4) & 0xFu];
	dst[6] = hex[argb & 0xFu];
	dst[7] = '\0';
	return 7;
}

AY_API __s32 ay_term_format_sgr(__u32 fg_argb, __u32 bg_argb, __u32 attrs, char *dst, __usize cap)
{
	__usize pos = 0;
	__s32 need_semi = 0;
	if (!dst || cap < 8u)
		return -AY_ENOSPC;

	pos = sk_write_lit(dst, pos, cap, "\x1b[");
	if (attrs & AY_SGR_BOLD) {
		pos = sk_write_lit(dst, pos, cap, "1");
		need_semi = 1;
	}
	if (attrs & AY_SGR_DIM) {
		if (need_semi)
			pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_lit(dst, pos, cap, "2");
		need_semi = 1;
	}
	if (attrs & AY_SGR_ITALIC) {
		if (need_semi)
			pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_lit(dst, pos, cap, "3");
		need_semi = 1;
	}
	if (attrs & AY_SGR_UNDERLINE) {
		if (need_semi)
			pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_lit(dst, pos, cap, "4");
		need_semi = 1;
	}
	if (attrs & AY_SGR_HAS_FG) {
		if (need_semi)
			pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_lit(dst, pos, cap, "38;2;");
		pos = sk_write_u8_dec(dst, pos, cap, (fg_argb >> 16) & 0xFFu);
		pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_u8_dec(dst, pos, cap, (fg_argb >> 8) & 0xFFu);
		pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_u8_dec(dst, pos, cap, fg_argb & 0xFFu);
		need_semi = 1;
	}
	if (attrs & AY_SGR_HAS_BG) {
		if (need_semi)
			pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_lit(dst, pos, cap, "48;2;");
		pos = sk_write_u8_dec(dst, pos, cap, (bg_argb >> 16) & 0xFFu);
		pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_u8_dec(dst, pos, cap, (bg_argb >> 8) & 0xFFu);
		pos = sk_write_lit(dst, pos, cap, ";");
		pos = sk_write_u8_dec(dst, pos, cap, bg_argb & 0xFFu);
		need_semi = 1;
	}
	if (!need_semi)
		pos = sk_write_lit(dst, pos, cap, "0");
	pos = sk_write_lit(dst, pos, cap, "m");
	if (pos >= cap)
		return -AY_ENOSPC;
	dst[pos] = '\0';
	return (__s32)pos;
}

AY_API __u32 ay_shell_index_count(void)
{
	return CATALOG_COUNT;
}

AY_API __s32 ay_shell_index_meta(__u32 idx, struct ay_shell_entry_meta *out)
{
	const struct sk_catalog_entry *e;
	if (idx >= CATALOG_COUNT || !out)
		return -AY_EINVAL;
	e = &g_catalog[idx];
	out->id = idx;
	out->category = e->category;
	out->source = e->source;
	out->platforms = e->platforms;
	out->slug_fnv1a = sk_fnv1a(e->slug);
	return 0;
}

AY_API __s32 ay_shell_index_field(__u32 idx, __u32 field_id, char *dst, __usize cap)
{
	const struct sk_catalog_entry *e;
	if (idx >= CATALOG_COUNT)
		return -AY_ENOENT;
	e = &g_catalog[idx];
	switch (field_id) {
	case AY_SHELL_FIELD_SLUG:    return sk_copy_cstr(e->slug, dst, cap);
	case AY_SHELL_FIELD_NAME:    return sk_copy_cstr(e->name, dst, cap);
	case AY_SHELL_FIELD_VERSION: return sk_copy_cstr(e->version, dst, cap);
	case AY_SHELL_FIELD_REPO:    return sk_copy_cstr(e->repo, dst, cap);
	case AY_SHELL_FIELD_DOCS:    return sk_copy_cstr(e->docs, dst, cap);
	case AY_SHELL_FIELD_CONFIG:  return sk_copy_cstr(e->config, dst, cap);
	case AY_SHELL_FIELD_BINARY:  return sk_copy_cstr(e->binary, dst, cap);
	default: return -AY_EINVAL;
	}
}

AY_API __s32 ay_shell_index_find(const char *slug, __usize len)
{
	__u32 lo = 0;
	__u32 hi = CATALOG_COUNT;
	if (!slug || len == 0)
		return -AY_EINVAL;
	while (lo < hi) {
		__u32 mid = lo + (hi - lo) / 2u;
		__s32 cmp = sk_cmp_ci(slug, len, g_catalog[mid].slug);
		if (cmp == 0)
			return (__s32)mid;
		if (cmp < 0)
			hi = mid;
		else
			lo = mid + 1u;
	}
	return -AY_ENOENT;
}

AY_API __s32 ay_shell_index_match(__u32 idx, const char *query, __usize len)
{
	const struct sk_catalog_entry *e;
	if (idx >= CATALOG_COUNT)
		return -AY_ENOENT;
	if (!query || len == 0)
		return 1;
	e = &g_catalog[idx];
	if (sk_contains_ci(e->slug, query, len)) return 1;
	if (sk_contains_ci(e->name, query, len)) return 1;
	if (sk_contains_ci(e->repo, query, len)) return 1;
	if (sk_contains_ci(e->binary, query, len)) return 1;
	if (sk_contains_ci(e->config, query, len)) return 1;
	return 0;
}
