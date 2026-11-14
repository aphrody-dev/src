// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Project Archetype Classifier (Node, Electron, VSCode, Discord, TS, Unreal, .NET, Rust).

use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProjectArchetype {
    ChromiumWebUiAndNode,
    ElectronDesktopApp,
    VsCodeWorkbench,
    DiscordClientOrBot,
    TypeScriptCompilerOrSdk,
    UnrealEngineMonorepo,
    MicrosoftDotNetNodeInterop,
    MicrosoftTypeScriptMonorepo,
    MicrosoftRustSystemsRepo,
    LegacyNodePackage,
    SovereignBunRustMonorepo,
}

impl ProjectArchetype {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::ChromiumWebUiAndNode => "chromium-webui-node",
            Self::ElectronDesktopApp => "electron-desktop",
            Self::VsCodeWorkbench => "vscode-workbench",
            Self::DiscordClientOrBot => "discord-client-bot",
            Self::TypeScriptCompilerOrSdk => "typescript-compiler-sdk",
            Self::UnrealEngineMonorepo => "unreal-engine-monorepo",
            Self::MicrosoftDotNetNodeInterop => "microsoft-dotnet-node",
            Self::MicrosoftTypeScriptMonorepo => "microsoft-typescript-monorepo",
            Self::MicrosoftRustSystemsRepo => "microsoft-rust-systems",
            Self::LegacyNodePackage => "legacy-node-package",
            Self::SovereignBunRustMonorepo => "aphrody-bun-rust-monorepo",
        }
    }

    pub const fn target_stack(self) -> &'static str {
        match self {
            Self::ChromiumWebUiAndNode => "Bun.build + Bun.Transpiler + Dawn/Skia Native FFI",
            Self::ElectronDesktopApp => "GPUI / Tauri Shell + Bun Native Sidecar",
            Self::VsCodeWorkbench => "GPUI DirectX 12 / Vulkan Workbench + Bun Extension Host",
            Self::DiscordClientOrBot => "Bun.serve WebSocket + Rust Audio FFI",
            Self::TypeScriptCompilerOrSdk => "OXC / tsrs + Bun check/fmt + Bun build --compile AOT",
            Self::UnrealEngineMonorepo => "Rust LTO C-ABI Kernel + Bun UBT Orchestrator",
            Self::MicrosoftDotNetNodeInterop => "CoreCLR hostfxr + [UnmanagedCallersOnly] C-ABI + bun:ffi",
            Self::MicrosoftTypeScriptMonorepo => "Bun Workspaces + OXC + Playwright-Bun",
            Self::MicrosoftRustSystemsRepo => "Rust 2024 LTO/AOT (windows-sys / zerocopy / argh) + bun:ffi",
            Self::LegacyNodePackage => "Bun + bun:sqlite + bun:ffi + bun test",
            Self::SovereignBunRustMonorepo => "Bun + Rust 2024 LTO + ay/depot",
        }
    }
}

/// Detects the project archetype from repository layout and package.json.
pub fn detect_archetype(root: &Path) -> ProjectArchetype {
    if root.join("Engine").join("Source").join("UnrealEditor.Target.cs").exists()
        || root.join("UnrealEditor.Target.cs").exists()
    {
        return ProjectArchetype::UnrealEngineMonorepo;
    }
    if root.join("product.json").exists() && root.join("src").join("vs").exists() {
        return ProjectArchetype::VsCodeWorkbench;
    }
    if root.join("BUILD.gn").exists() && (root.join("v8").exists() || root.join("shell").join("browser").exists()) {
        if root.join("shell").join("browser").exists() {
            return ProjectArchetype::ElectronDesktopApp;
        }
        return ProjectArchetype::ChromiumWebUiAndNode;
    }
    if root.join("src").join("compiler").join("checker.ts").exists() || root.join("Herebyfile.mjs").exists() {
        return ProjectArchetype::TypeScriptCompilerOrSdk;
    }
    if root.join("src").join("NodeApi").join("NodeApi.csproj").exists()
        || root.join("src").join("NodeApi.DotNetHost").exists()
    {
        return ProjectArchetype::MicrosoftDotNetNodeInterop;
    }
    if root.join("Cargo.toml").exists() && !root.join("package.json").exists() {
        return ProjectArchetype::MicrosoftRustSystemsRepo;
    }
    if root.join("rush.json").exists()
        || root.join("packages").join("playwright-core").exists()
        || root.join("packages").join("web-components").exists()
        || root.join("packages").join("react-components").exists()
    {
        return ProjectArchetype::MicrosoftTypeScriptMonorepo;
    }

    let pkg_json_path = root.join("package.json");
    if pkg_json_path.exists()
        && let Ok(content) = std::fs::read_to_string(&pkg_json_path)
    {
        let lower = content.to_ascii_lowercase();
        if lower.contains("\"node-api-dotnet\"") {
            return ProjectArchetype::MicrosoftDotNetNodeInterop;
        }
        if lower.contains("\"electron\"") {
            return ProjectArchetype::ElectronDesktopApp;
        }
        if lower.contains("vscode") || lower.contains("\"@types/vscode\"") {
            return ProjectArchetype::VsCodeWorkbench;
        }
        if lower.contains("discord.js") || lower.contains("\"@discordjs/") {
            return ProjectArchetype::DiscordClientOrBot;
        }
        if lower.contains("\"@playwright/") || lower.contains("\"@fluentui/") || lower.contains("\"@microsoft/tsdoc\"") {
            return ProjectArchetype::MicrosoftTypeScriptMonorepo;
        }
        if lower.contains("\"typescript\"") && lower.contains("\"compiler\"") {
            return ProjectArchetype::TypeScriptCompilerOrSdk;
        }
    }

    if root.join("bun.lock").exists() || root.join("bunfig.toml").exists() {
        return ProjectArchetype::SovereignBunRustMonorepo;
    }
    if root.join("package.json").exists() {
        return ProjectArchetype::LegacyNodePackage;
    }
    ProjectArchetype::SovereignBunRustMonorepo
}
