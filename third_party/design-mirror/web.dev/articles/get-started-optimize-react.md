---
source_url: https://web.dev/articles/get-started-optimize-react
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:36+00:00
sha256: 64207035f509f9efc97775e9c6983a6c6e2629fe9724d9521b8934627e009b18
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Want to make your React site as fast and accessible as possible? You've come to the right place!

Houssein Djirdeh [X](https://twitter.com/hdjirdeh) [GitHub](https://github.com/housseindjirdeh) [Homepage](https://houssein.me/)

> [!CAUTION]
> **Caution:** One or more demos on this page no longer work, as [Glitch has ended hosting](https://blog.glitch.com/post/changes-are-coming-to-glitch).

[React](https://reactjs.org/) is an open-source library that makes building UIs
easier. This learning path will cover different APIs and tools within the
ecosystem that you should consider using to improve the performance and
usability of your application.

This guide will show you how to get up and running with a React application.
Every other guide in this section will cover topics to optimize the speed or
accessibility of a React app.

## Why is this useful?

There's a lot of content that explains how to build fast and reliable
applications, but not many that show how to build fast and reliable **React**
applications. These guides cover all this from the perspective of a React
app where only libraries, APIs, and features specific to
the React ecosystem are mentioned.

## What will you learn?

The tutorials in this learning path do _not_ focus on:

- How to use React
- How React works under the hood

Although both of these concepts will be touched on when needed, all the guides
and codelabs in this section will instead focus on how to build fast and
accessible React sites. For this reason, [a basic knowledge of React is
required](https://reactjs.org/docs/getting-started.html).

## Create React App

[Create React App](https://facebook.github.io/create-react-app/) (CRA) is the
easiest way to get started building React applications. It provides a default
setup with a number of core features baked in, including a build system
containing a module bundler (webpack) and a transpiler (Babel).

On a command-line shell, you only need to run the following to create a new
application:

```bash
npx create-react-app app-name
```

> [!NOTE]
> **Note:** `npx` is a package runner that is installed automatically with `npm` 5.2.0 or later. It simplifies quite a few processes involved with managing packages---including running CLI commands like `create-react-app`---without having to install them globally on your machine. Take a look at [Introducing npx: an npm package runner](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) if you would like to learn more.

Once the command finishes executing, you can navigate to and run the application
with the following commands:

```bash
cd new-app
npm start
```

The following embed shows the directory structure and the actual web page of a newly
bootstrapped CRA application.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy" src="https://glitch.com/embed/#!/embed/new-create-react-app?attributionHidden=true&amp;sidebarCollapsed=true&amp;path=src%2FApp.js&amp;previewSize=100" style="height: 100%; width: 100%; border: 0;" title="new-create-react-app on Glitch"></iframe>

> [!NOTE]
> **Note:** Although CRA makes it simple to get started building a React application, there are many different ways to begin building sites with React. The ["Popular Alternatives"](https://github.com/facebook/create-react-app#popular-alternatives) in the README covers different use-cases and options.

There are multiple configuration files and build scripts that CRA uses to set up
a webpack and Babel build process that includes a base
[Jest](https://jestjs.io/) setup for testing. To make things simpler for the
user, these files are hidden and cannot be accessed until you eject from CRA. It
is always best to avoid ejecting whenever possible, since this means taking on all
of these configuration files as your own source code, which can become difficult
to manage.

The directory structure of a new CRA application only contains the files that
you would actually need to modify in order to work on your application. The
[CRA documentation](https://facebook.github.io/create-react-app/docs/folder-structure)
explains this in detail.

## What's next?

Now that you know how to get started building a Create React App, learn how
to improve your app's performance and accessibility with all the guides in
this learning path:

- [Code splitting with React.lazy and Suspense](https://web.dev/articles/code-splitting-suspense.md.txt)
- [Virtualize large lists with react-window](https://web.dev/articles/virtualize-long-lists-react-window.md.txt)
- [Precaching in Create React App with Workbox](https://web.dev/articles/precache-with-workbox-react.md.txt)
- [Pre-render routes with react-snap](https://web.dev/articles/prerender-with-react-snap.md.txt)
- [Add a web app manifest with Create React App](https://web.dev/articles/add-manifest-react.md.txt)
