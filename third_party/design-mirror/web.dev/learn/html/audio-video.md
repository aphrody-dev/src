---
source_url: https://web.dev/learn/html/audio-video
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:40+00:00
sha256: 13bc76bad6c42e7682129ac9fb7bccd8e8534059a5bb676e9f9f533c77cd80be
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

As you learned in the [images](https://web.dev/learn/html/images.md.txt) module, HTML enables
embedding media into a web page. In this section, we look at audio and video
files, including how to embed them, user controls, providing a static image
placeholder for your videos, and best practices, including making audio and
video files accessible.

## `<audio>` and `<video>`

The [`<video>`](https://developer.mozilla.org/docs/Web/HTML/Element/video) and [`<audio>`](https://developer.mozilla.org/docs/Web/HTML/Element/audio)
elements can be used to embed media players directly with the `src` attribute or can be used as the container element for a series of [`<source>`](https://developer.mozilla.org/docs/Web/HTML/Element/source) elements,
each providing a `src` file suggestion. While `<video>` can be used to embed an audio file, the `<audio>` element is preferable for embedding
sound files.

The opening `<video>` and `<audio>` tags can contain several other attributes including
`controls`, `autoplay`, `loop`, `mute`, `preload`, and the global attributes. The `<video>` element also supports the `height`, `width`, and
`poster` attributes.

```html
<video src="videos/machines.webm" poster="images/machine.jpg" controls>
  <p>Watch <a href="https://youtube.com/link">video on Youtube</a></p>
</video>
```

This `<video>` example has a single source with the `src` attribute linking to the video source. The `poster` attribute
provides an image to display as the video loads. Finally, the `controls` attribute provides user video controls.

Fallback content is included between the opening and closing tags. If the user agent doesn't support `<video>` (or `<audio>` this content is shown. The closing `</video>` tag is required, even if there is no content between the two
(but there should always be fallback content , right?).

If no `src` attribute is included on the opening `<video>` or `<audio>` tags, include one or more [`<source>`](https://developer.mozilla.org/docs/Web/HTML/Element/source) elements,
each with a `src` attribute to a media file. The following example includes three media file options, fallback content,
and English and French subtitles between the opening and closing tags.

```html
<video controls poster="images/machine.jpg">
  <source src="videos/machines.webm" type="video/webm" />
  <source src="videos/machines.mp4" type="video/mp4" />
  <source src="videos/machines.ogv" type="video/ogg" />
  <track
    label="English"
    kind="subtitles"
    srclang="en"
    src="vtt/subtitles-en.vtt"
    default
  />
  <track
    label="Francais"
    kind="subtitles"
    srclang="fr"
    src="vtt/subtitles-fr.vtt"
  />
  <p>Watch <a href="https://youtube.com/link">video on Youtube</a></p>
</video>
```

Each `<source>` child includes a `src` attribute pointing to the resource and the `type` attribute informs the browser
of the linked file's [media type](https://developer.mozilla.org/docs/Web/Media/Formats/Containers). This prevents the browser
from fetching media files it wouldn't be able to decode.

Within the `type` attribute, you can include a
[`codecs`](https://developer.mozilla.org/docs/Web/Media/Formats/codecs_parameter)
parameter, which specifies exactly how the resource is encoded. Codecs give you
a way to include media optimizations as progressive enhancements (elements not
supported by all browsers). The codec is separated from the media type with a
semicolon. For example, the codec can be written using intuitive syntax, such as
`<source src="videos/machines.webm" type="video/webm;codecs=vp8,vorbis">` which indicates that the
WebM files contain VP8 video and vorbis audio.

Codecs can also be more difficult to decipher, such as `<source src="videos/machines.mp4" type="video/mp4; codecs=avc1.4d002a">`
which indicates that the MP4 encoding is Advanced Video Coding Main Profile Level 4.2. Explaining this syntax is well beyond
the scope of this lesson. For more details, read Jake Archibald's post on [how to determine the codec parameter for an AV1 video](https://jakearchibald.com/2022/html-codecs-parameter-for-av1/).

When displaying a video, by default, the first frame of the video is shown as the still shot when it becomes available.
This is something that can be controlled. The `poster` attribute enables the source of an image to show while the video is downloading
and until it is played. If the video plays and is subsequently paused, the poster is not re-shown.

Make sure to define the aspect ratio of your video, because when the video loads, a size difference
between the poster and the video will cause a reflow and repaint.

Always include the [boolean](https://web.dev/learn/html/attributes.md.txt#boolean_attributes) `controls` attribute. This makes the user controls
visible, providing users with the ability to control audio levels, mute the audio completely, and expand the video to fullscreen.
Omitting `controls` creates a bad user experience, especially if the boolean `autoplay` attribute is included. Note that some
browsers will not heed the `autoplay` attribute directive if the boolean `muted` attribute is omitted because autoplaying a
media file is generally a bad user experience, even when muted and with visible controls.

## Tracks

Between the opening and required closing tags of both audio and video, include one or more [`<track>`](https://developer.mozilla.org/docs/Web/HTML/Element/track)
elements to specify timed text tracks. The following example includes two `<track>` files, providing timed text subtitles in both English and French.

```html
<track
  label="English"
  kind="subtitles"
  srclang="en"
  src="vtt/subtitles-en.vtt"
  default
/>
<track
  label="Français"
  kind="subtitles"
  srclang="fr"
  lang="fr-fr"
  src="vtt/subtitles-fr.vtt"
/>
```

The track files, specified in the `src` attribute, should be in [WebVTT format](https://developer.mozilla.org/docs/Web/API/WebVTT_API) (.vtt).
The files should be on the same domain as the HTML document, unless the [`crossorigin`](https://developer.mozilla.org/docs/Web/HTML/Attributes/crossorigin)
attribute is included.

There are five enumerated values for the track `kind` attribute: `subtitles`, `captions`, `descriptions`, `chapters`, and other `metadata`.

Include `subtitles` along with the `srclang` attribute for dialogue transcription and translations. The value of each `label` attribute
is displayed as an option to the user. The content of the selected VTT option is displayed over the video. The appearance of the
subtitles can be styled by targeting the [::cue/ ::cue()](https://developer.mozilla.org/docs/Web/CSS/::cue).

The value `kind="caption"` should be reserved for transcription and translations that include sound effects and other relevant audio information.
This isn't just for deaf viewers. Maybe a user can't find their headphones so they turned on the captions. Or maybe they didn't
quite catch the last few talking points from a favorite podcast, so they want to read the transcript to confirm their understanding.
Having alternative ways to access audio and video content is both important and convenient.

The `kind="description"` is for text descriptions of the visual content in the video for users who can't see the video, whether
they are using a system without a screen such as Google Home or Alexa, or are blind.

> [!NOTE]
> **Note:** The [audio and video](https://web.dev/learn/accessibility/video-audio.md.txt) section of [learn accessibility](https://web.dev/learn/accessibility.md.txt) goes into more detail about [captions](https://web.dev/learn/accessibility/video-audio.md.txt#captions), [transcripts](https://web.dev/learn/accessibility/video-audio.md.txt#transcripts), and [audio descriptions](https://web.dev/learn/accessibility/video-audio.md.txt#audio_descriptions).

[Providing captions and subtitles](https://developer.mozilla.org/docs/Web/Guide/Audio_and_video_delivery/Adding_captions_and_subtitles_to_HTML5_video)
using the [WebVTT format](https://developer.mozilla.org/docs/Web/API/WebVTT_API)
makes the video accessible to people with hearing impairments. Impaired hearing
can be due to the user being in a loud environment, having faulty speakers or
broken headphones, or because the person has hearing loss or identifies as Deaf.
Making sure your content is accessible helps many more people than you think;
it helps everyone.

## Background video considerations

Your marketing or design team may want your site to include a background video.
Generally, this means that they want a muted, auto-playing, looping video with
no controls. The HTML may look something like this:

```html
<video playsinline autoplay loop muted poster="images/machine.jpg" role="none">
  <source src="videos/machines.webm" type="video/webm" />
  <source src="videos/machines.mp4" type="video/mp4" />
  <source src="videos/machines.ogv" type="video/ogg" />
</video>
```

Background videos are not accessible. Content shouldn't be conveyed through background videos without providing users with full
control over playback and access to all captions. As this video is purely decorative, it includes the [ARIA role](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles)
of [`none`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/none_role) and omits any fallback content.
To improve the performance of always muted videos, [remove the audio track](https://gist.github.com/liangfu/97f877e311210fa0ae18a31fdd92982e) from your media sources.

If your video plays for five seconds or less, accessibility guidelines don't require a pausing mechanism, but anything
with the boolean `loop` attribute will loop forever by default, exceeding this five-second, or any other, time limit. For good
user experience, always include a method of pausing the video. This is most easily done by including `controls`.

## Custom media controls

To display custom video or audio controls, rather than the browser built-in controls, include the `controls` attribute. Then use
JavaScript to add custom media controls and remove the controls attribute. For example, you can add a `<button>` that toggles
the play state of an audio file.

```html
<button
  id="playPause"
  aria-controls="idOfAudio"
  data-pause-text="Pause audio"
  data-play-text="Play audio"
>
  Pause audio
</button>
```

This example includes a button with `dataset` attributes containing the text
that update as the visitor toggles between play and pause states. The
`aria-controls` attribute is included with the `id` of the element controlled
by the button; in this case, the audio. Each button that controls the audio has
an event handler.

To create customized controls, use
[`HTMLMediaElement.play()`](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/play)
and [`HTMLMediaElement.pause()`](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/pause).
When toggling the play state, also toggle the text of the button:

```javascript
const pauseButton = document.getElementById("playPause");

pauseButton.addEventListener("click", pauseAndPlay, false);

function pauseAndPlay() {
  console.log(this);
  const media = document.getElementById(this.getAttribute("aria-controls"));

  if (media.paused) {
    media.play();
    this.innerText = this.dataset.pauseText;
  } else {
    media.pause();
    this.innerText = this.dataset.playText;
  }
}
```

By including the `controls` attribute, the user has a way to control the audio (or video) even if JavaScript fails.
Only remove the controls attribute once a replacement button has been instantiated.

```javascript
document.querySelector("[aria-controls]").removeAttribute("controls");
```

Always include external controls when users can't access the controls, such as with background videos that have their controls hidden
behind site content. It is important to understand the basics of [media accessibility requirements](https://www.w3.org/WAI/WCAG21/Understanding/time-based-media) to accommodate users with
different environmental and sensory needs, including the millions of people with hearing loss and visual impairments.
We've just touched on the [`HTMLMediaElement`](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement) which provides several properties, methods, and events that are inherited by both the
[HTMLVideoElement](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement) and
[HTMLAudioElement](https://developer.mozilla.org/docs/Web/API/HTMLAudioElement), with `HTMLMediaElement` adding a few properties,
methods, and events of its own. There are several other [Media APIs](https://developer.mozilla.org/docs/Web/Media#apis),
including a [TextTrack API](https://developer.mozilla.org/docs/Web/API/TextTrack). You can use the [Media Capture and Streams](https://developer.mozilla.org/docs/Web/API/Media_Capture_and_Streams_API)
and [MediaDevices](https://developer.mozilla.org/docs/Web/API/MediaDevices) APIs to [record audio from a user's microphone](https://web.dev/patterns/media/microphone-record)
or [record a user's screen](https://web.dev/patterns/media/screen-record). The [Web Audio API](https://developer.mozilla.org/docs/Web/API/Web_Audio_API)
enables [manipulating live and pre-recorded](https://web.dev/patterns/media/audio-effects) audio and streaming, saving, or sending the audio to the `<audio>` element.

## Check your understanding

Test your knowledge of audio and video.
What is the `<track>` element used for?
To store information about the length and filesize of the video. Try again. To provide subtitles or captions. Correct! To store multiple versions of the video for different browsers or devices. Try again. What does the `poster` attribute control?
An image to display if the user's browser doesn't support video. Try again. An intro video. Try again. An image displayed as a still shot before the video is played. Correct!
