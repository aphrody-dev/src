---
source_url: https://web.dev/learn/accessibility/video-audio
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:36+00:00
sha256: faa497175a328841e0d9c11c73a4c7ad1302b8cb18b10d5f09e8c93728d6c730
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Have you ever wanted to watch a live event but couldn't find your headphones,
so you turned on the captions? Or maybe you didn't quite catch the last few
talking points from your favorite podcast, so you decided to read the
transcript instead? If so, you probably understand the importance and
convenience of having alternative ways to access audio and video content.

While your role at your company or organization may not require you to create
audio and video content directly, it's important to know the basics of
[accessibility requirements for media](https://www.w3.org/WAI/WCAG21/Understanding/time-based-media).
This knowledge will help you design and build the appropriate layouts and
features to accommodate users with different environmental and sensory needs,
such as the millions of people with hearing loss or visual impairment
worldwide.

## Alternative media types

Alternative media types were developed to support the media needs of people
with disabilities. This gives people additional formats to choose from when
accessing audio and video content.

The [alternative media types you must include](https://www.w3.org/WAI/media/av/planning/#wcag-standard)
with your media files depend on:

- The type of media you are supporting---audio-only, video-only, or video with audio (multimedia) formats
- Whether the media is live or prerecorded
- The version and level of WCAG compliance you are targeting
- Any additional media-related user needs

To create [accessible audio and video content](https://www.w3.org/WAI/media/av/)
for websites and apps, there are four main types of alternative media types:
[captions](https://web.dev/learn/accessibility/video-audio.md.txt#captions), [transcripts](https://web.dev/learn/accessibility/video-audio.md.txt#transcripts),
[audio descriptions](https://web.dev/learn/accessibility/video-audio.md.txt#audio_descriptions), and
[sign language interpretation](https://web.dev/learn/accessibility/video-audio.md.txt#sign_language_interpretation).

## Captions

One of the most widely used alternative media types are
[captions](https://www.w3.org/WAI/media/av/captions/). Captions are written
text synchronized with multimedia content for people who can't hear or
understand spoken words. They are presented in the same language as the main
audio track and include important non-speech information, such as sound
effects, background noises, and essential music.

Captions benefit people who are deaf, hard of hearing, or have cognitive
disabilities, but are useful to many other people as well.

Captions come in two forms---open or closed.

- Closed captions (CC) are text on top of a video that can be turned on or off by the viewer and, depending on the media player, styled in a way that fits the user's needs.
- Open captions (OC) are text burned into the video and cannot be turned off or styled differently.

One method might be preferable, depending on the situation or how the
multimedia will be consumed.

People often confuse captions with subtitles, but they aren't synonymous. Both
are text synchronized with multimedia content, often appearing at the bottom of
the media. Captions can be thought of as a transcription of dialogue and other
essential sounds for people with disabilities. Subtitles are visual text for
people who can hear the audio track but may not understand what was said, such
as when watching a foreign language film.

> [!NOTE]
> **Note:** There are some geographical differences in what are considered captions and subtitles, so be sure to check the terminology in your location.

| Features                             | Subtitles | Closed captions | Open captions |
| ------------------------------------ | --------- | --------------- | ------------- |
| Visual text matches audio track      | No        | Yes             | Yes           |
| Includes essential background sounds | No        | Yes             | Yes           |
| Ability to toggle on/off             | Yes       | Yes             | No            |

[Video](https://www.youtube.com/watch?v=pXc_w49fsmI) Check out an example of captions in this video, _Google --- A CODA Story_ . Toggle the CC button to **On** to see the closed captions on this video. Compare screenshots from this video, with and without captions.

## Transcripts

Close cousins to captions,
[transcripts](https://www.w3.org/WAI/media/av/transcripts/) are detailed,
text-based documents that capture all essential words, sounds, and important
visual information in your media. Transcripts primarily help people who are
hard of hearing or deaf, and descriptive transcripts help people who are
deafblind.

Transcripts are also useful for people with cognitive disabilities or for people
who want to review the content at their own speed.

While transcripts are typically more detailed than captions, they are very
similar in format and purpose. They are so similar that many people first add
captions to their media, export them, and then use them as the foundation of
their transcripts. Repurposing your captions to build your transcripts saves
time versus creating everything from scratch.

Search bots can't access your captions but can crawl your text transcripts.
When you include transcripts with your media files, your search engine
optimization gets a boost. It's one of those rare exceptions when
duplicate content isn't confusing to users or penalized by search engine
algorithms.

Every media player handles transcripts in a different way. Some providers may
not have that feature built into their media player, and even when they
do, some users may not be able to access the transcript interface. You can
ensure you've made your transcript available to all users by:

- Including the transcript text directly in-context, on the page with the embedded video.
- Adding a link to an accessible PDF containing the transcript.
- Linking out to the copy on another page.
- Including a link to the transcript, wherever it lives, within the video description on whatever media player platform you've used (such as YouTube or Vimeo).

For example, visit YouTube to watch
[_Password Problems? \| There's no place like Chrome_](https://www.youtube.com/watch?v=SlGuvC5nnTA)
and review an example of a transcript.
Under the video title, click and select **Show transcript** from the drop-down menu. The transcripts show up to the right or bottom of the video, depending on your screen size.

## Audio descriptions

Another alternative media used to support people with disabilities is
[audio description](https://www.w3.org/WAI/media/av/description/). This type
of alternative media utilizes a narrator to explain important visual
information to people who can't see the visual content. These descriptions
include nonverbal information such as facial expressions, unspoken actions, and
the background environment in video-only and multimedia content.

Sometimes audio descriptions need to be very detailed due to the large amount
of information that needs to be shared with the viewer. If there aren't enough
natural pauses in the video for audio descriptions, extended audio descriptions
are used. In extended audio descriptions, a video will pause to give a narrator
enough time to convey all the information in the media before playing the rest
of the video.

Audio descriptions and extended audio descriptions help people who are blind or
have low vision, but could help people with some cognitive disorders as well.
[Video](https://www.youtube.com/watch?v=fNq5jWyEeWo) Here's an example of an illustrated video with an audio description, titled _`[Audio Described]` Get started with Lookout from Google \|
Android_.

## Sign language interpretation

Another major alternative media type you may encounter is [sign language
interpretation](https://www.w3.org/WAI/media/av/sign-languages/), where
an interpreter narrates the auditory portion of the audio-only or multimedia
content using sign language. This is very important for many people who are
deaf, as sign language is their first and most fluent language.

Sign language interpretation is often more expressive and detailed than written
documents, providing a much richer experience than captions or transcripts
alone.

That said, sign language interpretation can be time-consuming and
cost-prohibitive to many organizations. And even if you have the time and
budget to add sign language interpretation to your media, there are
[over 300 different sign languages](https://en.wikipedia.org/wiki/List_of_sign_languages)
worldwide. Adding one sign language interpretation to your media wouldn't be
enough to support a global audience.
[Video](https://www.youtube.com/watch?v=MbHuSHGZf5U) See how sign language interpreters narrated the story of Google sustainability in the video _Google Presents: Search On '22_.
