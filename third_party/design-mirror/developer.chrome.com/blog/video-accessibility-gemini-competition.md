---
source_url: https://developer.chrome.com/blog/video-accessibility-gemini-competition
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: 824bc08b934694cb3a2395d5d671bcee70245c383ef5a9b6852951c5196344fd
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Alexandra Klepper [GitHub](https://github.com/alexandrascript) [Bluesky](https://bsky.app/profile/alexandrascript.com)

Published: November 21, 2024

After numerous incredible submissions to the
[Gemini API Developer Competition](https://ai.google.dev/competition), we've
selected the winner for best web application:
[ViddyScribe](https://www.viddyscribe.com/).

ViddyScribe exemplifies how Gemini can help make videos more accessible on
YouTube, and potentially beyond, by generating audio descriptions of any video
that are tailored to people who are visually impaired.
[Video](https://www.youtube.com/watch?v=MsN_YbwviUU)

## Features and Gemini capabilities

ViddyScribe built a user-first designed application. While a number of solutions
already exist to generate transcripts and audio descriptions, ViddyScribe
prioritized creating an output that prioritizes both quick results and a
pleasant user experience for a specific audience: people with visual
impairments.

Manual annotation of videos to offer addition details for this audience takes
too much time, and is often neglected. ViddyScribe used Gemini to help create a
custom solution that scales beyond adding some arbitrary frame descriptions to
a text file.
 The ViddyScribe app allows users to use a sample video or upload their own (100MB and 2 minutes long) to generate audio descriptions with Gemini.

ViddyScribe used [prompt engineering](https://web.dev/articles/practical-prompt-engineering)
to get the best results, curating the question language and style for Gemini 1.5
Pro. This prompt used chain-of-thought prompting to request:

- Purpose and context of the video.
- Tailored audio descriptions using video-specific analysis and guidelines.
- Reformatted timestamps and descriptions for a predictable and consistent format.

## Why we chose ViddyScribe

We chose ViddyScribe because it was an elegant solution to a real user problem.

While they found there were other applications on the market providing audio
descriptions, they felt the needs of people who are deaf and visually impaired
were not fully understood. These developers worked with real people who
have these disabilities to determine exactly what they needed in an audio
description application.

The experience of people with disabilities can vary greatly, and sometimes, they
may have competing needs. Additionally, audio descriptions can also make these
videos accessible to people who are neurodivergent and others that prefer to
read a transcript rather than watching a video.

> [!TIP]
> **Tip:** If you're new to building accessible web applications, we recommend you take our [Learn Accessibility](https://web.dev/learn/accessibility) course. Discover more information about [accessible video and audio](https://web.dev/learn/accessibility/video-audio).

We're excited to see how developers continue to enhance ViddyScribe, expanding
the audience and capabilities in the future.

## Keep building with built-in AI APIs

ViddyScribe was just one of the many amazing applications you built with Gemini.

We're developing [built-in AI](https://developer.chrome.com/docs/ai/built-in): web platform APIs and browser
features designed to integrate AI models, including large language models
(LLMs), directly into the browser.

Discover the [available APIs](https://developer.chrome.com/docs/ai/built-in-apis.md.txt) to start building powerful
websites, web applications, and Chrome Extensions.

Share what you build with us at
[@ChromiumDev](https://twitter.com/ChromiumDev) or share with
[Chrome for Developers on LinkedIn](https://www.linkedin.com/showcase/chrome-for-developers/).
