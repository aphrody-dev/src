---
source_url: https://developer.chrome.com/blog/taking-advantage-of-gpu-acceleration-in-the-2d-canvas
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:40+00:00
sha256: 332a4d9b3c923f62d0c0a870ae8b0dc9915b8cb74bdadade0aa711d8d1d52c79
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Ilmari Heikkinen [X](https://twitter.com/ilmarihei) [Homepage](http://fhtr.org/)

The 2D canvas in Chrome got some hardware acceleration love back in February. The acceleration makes drawing 2D sprites really fast, as the implementation is using the GPU to do drawImage.

You can check out [this example](http://fhtr.org/gravityring/sprites.html) for the kinds of things the acceleration enables. The demo is drawing 180 transformed 256x256 PNG sprites on a full-window canvas and running an N-body simulation on them to make the sprites gravitate towards each other. And it all runs smoothly at 30 to 60 frames per second on a low-powered laptop.

There are still some rough edges in the acceleration implementation, so you may see performance degradation in some use cases (please let the Chrome team know through [new.crbug.com](http://new.crbug.com) so that we can fix them!)
