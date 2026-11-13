---
source_url: https://web.dev/learn/accessibility/glossary
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 1751662ae6f4fad96f204bbf054742807b10c83fec1789f38b72a18a78296ce5
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Here are some common terms and concepts for accessibility. This guide is
includes key terms for web accessibility that we discuss within the course. For
more technical terminology, refer to the
[WCAG glossary](https://www.wcag.com/resource/wcag-com-glossary/).

To better understand language around disability and accessibility, read our
[inclusive language style guide](https://developers.google.com/style/inclusive-documentation).

## A11y

[A11y](https://www.a11yproject.com/posts/a11y-and-other-numeronyms/) is
numeronym for accessibility (a + 11 letters + y). Typically pronounced as
"ally" as in "a person or group that provides assistance and support in an
ongoing effort, activity, or struggle," giving the term "a11y" multiple
meanings.

## Accessibility Conformance Report (ACR)

The [ACR](https://tetralogical.com/blog/2021/10/15/introduction-to-accessibility-conformance-reports/)
is the final report presented to a client once a full ACT has been performed.
If you need a legally binding version of the ACR, you would use a version
of the [Voluntary Product Accessibility Template (VPAT)](https://web.dev/learn/accessibility/glossary.md.txt#vpat).

## Accessibility Conformance Testing (ACT)

[ACT](https://www.w3.org/WAI/standards-guidelines/act/) is commonly referred to
as an accessibility audit. The ACT uses various testing methodology and
tools: primarily automated, manual, and [assistive technology](https://web.dev/learn/accessibility/glossary.md.txt#at) (AT)
devices.

ACT is first performed as a baseline metric to gauge general
accessibility compliance of a digital product. It's often run multiple times
throughout the software product lifecycle to check for changes in the level of
conformance against a set of pre-determined accessibility checkpoints or
guidelines.

## ARIA

[ARIA](https://www.w3.org/WAI/standards-guidelines/aria/) is an acronym for
Accessible Rich Internet Applications (formally known as WAI-ARIA---Web
Accessibility Initiative Accessible Rich Internet Applications). ARIA is a
specification written by the W3C, defining a set of attributes that you can add
to HTML elements to support accessibility. These attributes communicate role,
state, and property to assistive technologies with accessibility APIs
implemented in the accessibility tree in modern browsers.

## Assistive technology (AT)

[AT](https://en.wikipedia.org/wiki/Assistive_technology) is hardware and
software that can be no-tech (such as a mouthstick), low-tech (such as a
keyboard), or high-tech (such as a screen reader). AT is used to help increase,
maintain, or improve the capabilities of performing a task for a person with
disabilities. AT includes braille keyboards, audio browsers, screen magnifiers,
and alternative pointing devices.

## Captions: Closed and open

_Captions_ are words that describe the audio or sound portion of a program or
video. Captions include dialogue, identify who is speaking, and include
non-speech information conveyed through sound, including meaningful sound
effects. Captions should be included with
[prerecorded content](https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html)
and [live content](https://www.w3.org/WAI/WCAG21/Understanding/captions-live),
to help people who are deaf, hard of hearing, or have other auditory processing
disabilities have equal access to multimedia content.

There are two types of captions. _Closed captions_ can be turned on and off by
the viewer, while _open captions_ (sometimes referred to as subtitles) cannot.

## Digital accessibility

[Digital accessibility](https://www.w3.org/WAI/fundamentals/accessibility-intro/)
is the practice of building digital products so that all users, regardless of
their disability, have equal access to the content or functionality of the
product.

## POUR

[POUR](https://www.w3.org/WAI/fundamentals/accessibility-principles/) is
shorthand for Perceivable, Operable, Understandable, and Robust, which are the
foundational human-focused principles of WCAG.

## Screen reader

A [screen reader](https://www.afb.org/blindness-and-low-vision/using-technology/assistive-technology-products/screen-readers)
is a high-tech assistive technology that uses synthetic language to read and
navigate digital documents for people with low or no vision, cognitive issues,
and other disabilities.

- Desktop
  - [ChromeVox](https://support.google.com/chromebook/answer/7031755) (ChromeOS)
  - [JAWS](https://www.freedomscientific.com/Products/software/JAWS/) (Windows)
  - [Narrator](https://support.microsoft.com/en-us/windows/complete-guide-to-narrator-e4397a0d-ef4f-b386-d8ae-c172f109bdb1) (Windows)
  - [NVDA](https://www.nvaccess.org/) (Windows)
  - [Orca](https://wiki.gnome.org/Projects/Orca) (Linux)
  - [VoiceOver](https://www.apple.com/accessibility/vision/) (macOS)
- Mobile
  - [TalkBack](https://support.google.com/accessibility/android/answer/6283677) (Android)
  - [VoiceOver](https://www.apple.com/accessibility/vision/) (iOS)
- [Screen Reader Keyboard Shortcuts and Gestures](https://dequeuniversity.com/screenreaders/)

## VPAT

[VPAT](https://en.wikipedia.org/wiki/Voluntary_Product_Accessibility_Template)
is shorthand for Voluntary Product Accessibility Template. A VPAT is a template
to draft an [Accessibility Conformance Report](https://web.dev/learn/accessibility/glossary.md.txt#acr) (ACR). An ACR clearly
states which accessibility standards a product or service meets and warns users
about any "accessibility blockers" they may encounter.

VPATs are reports of the state of a product from an accessibility conformance
perspective. The existence of VPAT alone doesn't guarantee that a digital
product is 100% accessible.

## Web Accessibility Initiative (WAI)

The [Web Accessibility Initiative (WAI)](https://www.w3.org/WAI/) is a
sub-group of the W3C focuses only on digital accessibility.

## Web Content Accessibility Guidelines (WCAG)

Web Content Accessibility Guidelines (commonly referred to as
[WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/)) is an international
set of accessibility standards developed through the W3C, in cooperation with
individuals and organizations. WCAG's goal is to provide a single, shared
standard for digital accessibility that meets the needs of individuals,
organizations, and governments worldwide.
