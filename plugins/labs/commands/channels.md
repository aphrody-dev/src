---
description: Rafraîchir les pins Chrome Stable/Beta/Dev/Canary (just channels)
allowed-tools: Bash(just:*)
---
Dans C:\labs : `just channels`, puis comparer `third_party/chrome-channels.toml` à l'état précédent (Chromium, V8, clang, Rust). Si Stable change : proposer `just factory-deploy` puis `/labs:factory all stable`.
