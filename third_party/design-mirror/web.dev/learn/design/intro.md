---
source_url: https://web.dev/learn/design/intro
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: e4ff5423df7b73ce7484a62776f9ea6340b7d0e882f9688023c738851d129db2
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Right from the start, the World Wide Web was designed to be independent of
your choice of hardware and operating system.
As long as you can connect to the internet, the World Wide Web is accessible
to you.

In the early days of the web, most people were using desktop computers.
These days the web is available on desktops, laptops, tablets, foldable phones,
fridges, and cars. People rightly expect that websites look good no matter
what device they use. Responsive design makes this possible.

Responsive design isn't the first approach to designing websites.
In the years before responsive design, web designers and developers tried many different techniques.

## Early design choices

Developers built websites that were either [fixed-width](https://web.dev/learn/design/intro.md.txt#fixed-width_design)
or [liquid layouts](https://web.dev/learn/design/intro.md.txt#liquid_layouts).

### Fixed-width design

In the early 1990s, when the web was first becoming popular,
most monitors had screen dimensions of 640 pixels wide by 480 pixels tall.
These were convex cathode ray tubes,
unlike the flat liquid crystal displays we have now.
 The Microsoft website in the late 90s designed for a width of 640 pixels. Screenshot from [archive.org](https://archive.org)

In the formative days of early web design,
it was a safe bet to design web pages with a width of 640 pixels.
But while other technologies like phones and cameras were miniaturizing,
screens were getting bigger (and eventually, flatter).
Before long, most screens had dimensions of 800 by 600 pixels.
Web designs changed accordingly. Designers and developers started assuming that 800 pixels was a safe default.
 The Microsoft website in the early 2000s designed for a width of 800 pixels. Screenshot from [archive.org](https://archive.org)

Then the screens got bigger again. 1024 by 768 became the default.
It felt like an arms race between web designers and hardware manufacturers.

​​
 The Microsoft website in the mid 2000s designed for a width of 1024 pixels. Screenshot from [archive.org](https://archive.org)

Whether it was 640, 800, or 1024 pixels,
choosing one specific width to design for was called fixed-width design.

If you specify a fixed width for your layout,
then your layout only looks good at that specific width.
If a visitor to your site has a wider screen than the width you have chosen,
then there's wasted space on the screen.
You can center the content of your pages to distribute that space more evenly
(instead of having empty space on one side) but you still wouldn't be taking full advantage of the available space.
 The Yahoo website from the early 2000s as experienced in a browser that's wider than the site's 800 pixel wide design. Screenshot from [archive.org](https://archive.org)

Similarly, if a visitor arrives with a narrower screen than the width you've chosen,
then your content won't fit horizontally.
The browser generates a crawlbar---the horizontal equivalent of a scrollbar---and the user has to move the whole page left and right to see all the content.
 The Yahoo website from the early 2000s as experienced in a browser that's narrower than the site's 800 pixel wide design. Screenshot from [archive.org](https://archive.org) <iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/RwZjwoQ?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

### Liquid layouts

While the majority of designers used fixed-width layouts, some chose to make their layouts flexible.
Instead of using fixed widths for your layouts you could make a flexible layout using percentages for your column widths.
These designs work in more situations than a fixed-width layout that only looks right at one specific size.

These were called liquid layouts.
But while a liquid layout can look good across a wide range of widths, it worsens at the extremes.
On a wide screen the layout looks stretched.
On a narrow screen the layout looks squashed. Both scenarios aren't ideal.
 Wikipedia's liquid layout from the mid 2000s as experienced in a narrow browser window. Screenshot from [archive.org](https://archive.org)  Wikipedia's liquid layout from the mid 2000s as experienced in a wide browser window. Screenshot from [archive.org](https://archive.org)

You can mitigate these problems by using `min-width` and `max-width` for your layout.
But then at any size below the minimum width or above the maximum width you've got the same issues you'd have with a fixed-width layout.
On a wide screen there'd be unused space going to waste.
On a narrow screen, the user would have to move the whole page left and right to see everything.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/YzxEzpE?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe> Open [the liquid layout example](https://codepen.io/web-dot-dev/pen/YzxEzpE) in a new browser window to see how changing the size of the window stretches the design.

The word *liquid* is just one of the terms used to describe this kind of layout.
These kinds of designs were also called fluid layouts or flexible layouts.
The terminology was as fluid as the technique.

## Build for different screen sizes

In the 21st century, the web continued to get bigger and bigger.
So did monitors. But new screens arrived that were smaller than any desktop device.
With the arrival of mobile phones with fully-featured web browsers, designers faced a dilemma.
How could they ensure their designs would look good on a desktop computer and a mobile phone?
They needed a way of styling their content for screens as small as 240 pixels wide and as large as thousands of pixels wide.

### Separate sites

One option is to make a separate subdomain for mobile visitors.
But then you have to maintain two separate codebases and designs.
And in order to redirect visitors on mobile devices, you'd need to do
[user-agent sniffing](https://en.wikipedia.org/wiki/Browser_sniffing),
which can be unreliable and spoofed.
Chrome has [reduced the user-agent string](https://developers.google.com/privacy-sandbox/protections/user-agent) to prevent such passive fingerprinting.
Also, there's no clear line between mobile and not-mobile. Which site do you send tablet devices to?

### Adaptive layouts

Instead of having separate sites on different subdomains,
you could have a single site with two or three fixed-width layouts.

When media queries first arrived in CSS, they opened the door to making layouts more flexible.
But many developers were still most comfortable making fixed-width layouts.
One technique involved switching between a handful of fixed-width layouts at specified widths.
Some people call this an adaptive design.

Adaptive design allowed designers to provide layouts that looked good at a few different sizes,
but the design never looked quite right when viewed between those sizes.
The problem of excess space persisted although it wasn't as bad as in a fixed-width layout.

Using CSS media queries, you can give people the layout that's closest to their browser width.
But given the variety of device sizes, chances are the layout looks less than perfect for most people.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/oNeoNYw?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe> Open [the adaptive layout example](https://codepen.io/web-dot-dev/pen/oNeoNYw) in a new browser window to see how changing the size of the window causes the design to jump between layouts.

### Responsive web design

If adaptive layouts are a mashup of media queries and fixed-width layouts, responsive web design is a mashup of media queries and liquid layouts.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/JjyOjbE?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen JjyOjbE by web-dot-dev on Codepen"></iframe> Open [the responsive design example](https://codepen.io/web-dot-dev/pen/JjyOjbE) in a new browser window to see how changing the size of the window causes the design to fluidly change layout.

The term was coined by [Ethan Marcotte](https://ethanmarcotte.com/) in
[an article in A List Apart](https://alistapart.com/article/responsive-web-design/) in 2010.

Ethan defined three criteria for responsive design:

1. Fluid grids
2. Fluid media
3. Media queries

The layout and images of a responsive site would look good on any device. But there was one problem.

### A `meta` element for `viewport`

Browsers on mobile phones had to deal with websites that were designed with fixed-width layouts for wider screens.
By default mobile browsers assumed that 980 pixels was the width that people were designing for (and they weren't wrong).
So even if you used a liquid layout,
the browser would apply a width of 980 pixels and then scale the rendered web page down to the actual width of the screen.

If you use responsive design, you need to tell the browser not to do that scaling.
You can do that with a `meta` element in the `head` of the web page:

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

There are two values, separated by commas.
The first one is `width=device-width`.
This tells the browser to assume the width of the website is the same as the width of the device
(instead of assuming the width of the website is 980 pixels).
The second value is `initial-scale=1`.
This tells the browser how much or how little scaling to do.
With a responsive design, you don't want the browser to do any scaling at all.
 The phone on the left shows how the layout looks before the meta tag is in place, when compared to the layout on the right.

With that `meta` element in place, your web pages are ready to be responsive.

## Modern responsive design

Now, we can make websites that are responsive in ways far beyond viewport sizes.
Media features give developers access to user preferences and enable customized experiences.
Container queries enable components to own their own responsive information.
The `picture` element empowers designers to make art-direction decisions based on screen ratios.

### Check your understanding

Test your knowledge of responsive web design
In 2021, it's a safe bet to design web pages at a fixed width?
true It's unsafe to bet on fixed width design in 2021. false 🎉 Correct! The number of possible screen sizes is too great to assume visitors will come from one size. Liquid layouts generally struggle at which kind of screen sizes?
Narrow screens 🎉 Correct! The extreme size of a narrow display can make liquid layouts appear squished. Average screens Try again. Liquid layouts do well on average sized screens. Wide screens 🎉 The extreme size of a wide, or even ultrawide, display can make liquid layouts appear stretches out to uncomfortable reading lengths. Short screens Try again. Short screens generally don't struggle to support liquid layouts. Tall screens Try again. Tall screens generally don't struggle to support liquid layouts. All screens Try again. Liquid layouts are a great choice for many screen sizes. The original three criteria for responsive design are?
Fluid typography Try again! Fluid typography was not one of the initial criteria. Fluid grids 🎉 Correct! Adaptive grids Try again! An adaptive grid changes based on set viewport sizes. Fluid media 🎉 Correct! Fixed width design Try again! Fixed width designs refers to a design with a set, unresponsive width. Media Queries 🎉 Correct!

Responsive design is an exciting, growing world of possibilities.
In the rest of this course, you'll learn about these technologies and how
to use them to create beautiful, responsive websites for everyone.
