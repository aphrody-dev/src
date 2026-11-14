---
name: android-appfunctions
description:
  Analyzes Android apps to find user workflows to expose as AppFunctions,
  such as creating a note, playing media, or sending a message. AI agents, voice commands,
  and system shortcuts then run them without opening the app UI. Generates Kotlin
  code with the androidx.appfunctions library, and refines KDoc and the app description
  so that agents choose and call functions correctly. Use this skill when discovering,
  implementing, documenting, testing, or upgrading AppFunctions in an Android app,
  including @AppFunctionDeclaration, @AppFunctionSerializable, @AppFunctionServiceEntryPoint,
  AppFunctionService, app_metadata.xml, appfn:instructions, adb shell cmd app_function,
  and legacy @AppFunction or AppFunctionConfiguration.Provider code. Don't use for
  building agents that call AppFunctions or for remote MCP servers.
license: Complete terms in LICENSE.txt
metadata:
  author: Google LLC
  last-updated: "2026-11-08"
  keywords:
    - AppFunctions
    - Kotlin
    - KSP
    - ADB
    - AI
    - LLM
    - MCP
---

> Mirror generated from android/skills (android-skills/device-ai/appfunctions) by `bun packages/ai-os/src/google/absorb.ts skills --write`; do not edit here.
> In src: entry skill `.agents/skills/android-ndk-compose/SKILL.md`, Material 3 Expressive tokens `packages/design/tokens/adapters/Theme.kt`,
> Pure C11/JNI/NDK ABI `src/include/ay/sys.h` (`src/include/uapi/ay/ui.h`, `libaysys.so`). JS/TS: bun only.

Analyzes Android apps to identify key user workflows to expose as AppFunctions,
such as creating a note, playing media, or sending a message, for AI agents,
voice commands, and system shortcuts to run without opening the app UI.

Generates Kotlin code to expose these workflows to the Android system,
allowing agents to discover and execute them on-device.

Also refines KDoc documentation and the app description so AI agents correctly
understand and use the provided functionality.

## Prerequisites

The app must **`targetSdk 36`** or newer and use **`compileSdk 37`** or newer as
AppFunctions, part of the Android platform API, are available from Android 16
onwards.
Always use the Jetpack library because it handles backward compatibility.
Use `androidx.appfunctions:appfunctions` and the KSP compiler
`androidx.appfunctions:appfunctions-compiler`, version 1.0.0-beta01 or later.

## Workflows

This skill enables the caller to discover features that will be provided to
system agents, implement these with AppFunctions, improve function description
for agents, and use ADB commands for local evaluation and testing.

The full AppFunction development flow consists of these four steps:

- _[Step 1: Discovery](references/feature-discovery-analysis.md)_: Analyze Android codebases to identify and recommend potential AppFunctions. Use this step when a user asks to "discover AppFunctions," "find features for AI," or "analyze my app for agentic tools."
- _[Step 2: Implementation and configuration](references/implementation-configuration.md)_: Generate Kotlin implementations of AppFunctions, manage system-wide configuration, and configure build dependencies. Use this step when a user asks to "implement AppFunctions," "set up the AppFunctions framework," or "configure Hilt for AppFunctions."
- _[Step 3: KDoc refinement](references/kdoc-refinement-optimization.md)_: Optimize AppFunction KDoc and the app description for AI agents and Model Context Protocol. If a user asks to "write KDoc", "optimize for MCP", or "refactor tool descriptions for LLMs", use this step.
- _[Step 4: Testing and debugging](references/adb-interaction-testing.md)_: Provide commands to interact with AppFunctions using ADB for testing and debugging. If a user wants to "list app functions", "invoke an app function", or "verify app function registration" on a device, use this step.

When the user asks for a subset of the steps, run those steps and any step
that the critical constraints require. Then list the skipped steps and ask
whether to run them.

If they apply, you must load the following references:

- _[Context and terminology](references/context.md)_: Defines the ubiquitous language, architecture definitions, and design patterns across the AppFunctions skill suite. Load when you need to understand core architecture terminology or check the distinctions between modern and legacy AppFunctions APIs.
- _[Migration to service entry point](references/migrate-to-service-entry-point.md)_ : Migrates apps on AppFunctions 1.0.0-alpha09 or lower to the `AppFunctionServiceEntryPoint` architecture from 1.0.0-alpha10, and upgrades apps to 1.0.0-beta01. Load it when a user asks to migrate or upgrade existing AppFunctions code. When you find legacy `AppFunctionConfiguration.Provider` implementations, `@AppFunction` annotations, or `appfn:description` attributes, load it and ask the user before you migrate.

## Critical constraints

- **Modular consistency**: You must refine KDocs immediately after you generate AppFunction implementations.
- **Security**: Expose only safe, non-destructive tasks that the app's UI already offers on that form factor. Never give agents wide-ranging access to user data or system resources. Never require or return passwords, financial details, private keys, or other highly sensitive personal information.
- **Descriptions**: Describe what each function does, never how an agent must behave. Put call order across functions in the app description, not in function KDoc.

## Troubleshooting

- If you encounter build-time errors such as Kotlin Symbol Processing (KSP) issues, see [Implementation and configuration](references/implementation-configuration.md).
- If you encounter runtime errors such as missing services or execution failures, see [Testing and debugging](references/adb-interaction-testing.md).
- If you need architecture definitions and vocabulary, see [Context and terminology](references/context.md).
- If you encounter issues when upgrading AppFunctions, such as errors on `@AppFunction`, which is no longer an annotation, see [Migration to service entry point](references/migrate-to-service-entry-point.md).
