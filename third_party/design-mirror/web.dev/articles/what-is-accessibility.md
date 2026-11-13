---
source_url: https://web.dev/articles/what-is-accessibility
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: b1fd17d48ff2a1ff17d57c0c9e9e72fd21b7946f76d7c54df558e6ce58f58d53
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Rob Dodson [X](https://twitter.com/rob_dodson) [GitHub](https://github.com/robdodson) [Homepage](https://robdodson.me) Alexandra Klepper [GitHub](https://github.com/alexandrascript) [Bluesky](https://bsky.app/profile/alexandrascript.com)

Published: November 18, 2018

A website, web apps, tool, browser, and other web technologies are accessible
when they're designed and built so that people with disabilities can use them.
This encompasses all disabilities which affect access to the web, including
auditory, cognitive, neurological, physical, speech, and visual.

Web accessibility also benefits people without disabilities. However, the
the primary audience for making your web technology accessible should always
be people with disabilities.

Developers may assume that all users can see and use a keyboard, mouse, or
touchscreen to interact with your page. This may lead to an experience that
works well for some people, but creates issues for others that range from an
annoyance to a complete usage blocker.

> [!TIP]
> **Tip:** Take [Learn Accessibility](https://web.dev/learn/accessibility.md.txt) to improve your skills and build more accessible web technologies.

## Understand the diverse needs of your users

When learning about accessibility, it helps understand the diverse range of
web users in the world and the types of accessibility needs they have.
To explain further, here's an informative video from Victor Tsaran,
a Technical Program Manager at Google.

[Video](https://www.youtube.com/watch?v=RHIVx4m8V4M)

Generally speaking, accessibility concerns can be split into four broad
categories:

- Vision
- Motor and dexterity
- Auditory
- Cognitive

Planning for accessibility means thinking about users who are experiencing some
type of impairment or disability in one or more of these categories. Bear
in mind that that experience might be non-physical or temporary---for instance,
trying to read a screen outside during a bright, sunny day or operating a
device one-handed while carrying a cup of coffee.

When you plan for these situations upfront, you end up with an experience that
is more robust and works for more users regardless of their ability or
context.

### Vision

Vision impairments range from limited or low vision to complete blindness. Users
with low vision may use a combination of screen magnification, high contrast
themes, and text-to-speech to access content. Some users may rely on a screen
reader or braille display to navigate a page, perform actions, and read
descriptions of content and controls.

### Motor and dexterity

Motor and dexterity impairments may affect a user's ability to use a mouse,
touchscreen, or other pointing device. Some users may rely on alternative input
devices to access content. These devices might include a keyboard, head- or
eye-tracking software, switch devices, sip-and-puff devices, or voice access.

### Auditory

Auditory impairments range from difficulty hearing certain frequencies, to
speech processing issues, to a total inability to hear sound. Users
experiencing an auditory impairment may rely on captions or transcripts to
provide an alternative to sound in an interface.

### Cognitive

Cognitive impairment is a broad category, encompassing topics such as ADHD,
dyslexia, and autism, just to name a few. The accommodations for these users are
quite diverse, but generally speaking, users may seek to minimize distractions,
flashing, heavy animations, and anything which shifts the user's context around
the page in an unexpected way.

Users may also use custom colors and styles to improve readability or prevent
headaches.
