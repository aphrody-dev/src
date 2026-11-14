---
name: gemini-ai-studio-multimodal
description: Router to the official google-gemini/gemini-skills (Gemini API, Live bidirectional streaming, Omni video, shell CLI), vendored in third_party/gemini-skills. Use for Gemini API code, media generation or Live API work.
---

# Gemini API, Live API and Omni video

Read the matching upstream skill before writing code; model names and parameters change faster than this file.

- `third_party/gemini-skills/skills/gemini-api-dev/SKILL.md`: code that calls the Gemini API (text, chat, multimodal input, image/video/speech generation, streaming, background tasks).
- `third_party/gemini-skills/skills/gemini-api-cli/SKILL.md`: the same API from the shell (media generation, file and YouTube analysis, transcription, Deep Research).
- `third_party/gemini-skills/skills/gemini-live-api-dev/SKILL.md`: real-time WebSocket audio/video/text streaming and migration between Live models.
- `third_party/gemini-skills/skills/gemini-omni-flash-api/SKILL.md`: generative video editing and text/image/video-to-video.

Refresh the clone with the monorepo's upstream flow (`src.lock.json`, `third_party/forks.txt`) before relying on a model id. In this repo Gemini is reached through the relay (`ai-os relay`, skill `ai-os-orchestrator`) and the `gemini-review` skill.
