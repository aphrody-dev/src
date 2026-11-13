---
source_url: https://web.dev/articles/performance-as-a-default-with-nextjs
fetched: 2026-11-13
lastmod: 2026-11-12T16:17:57+00:00
sha256: 0fd427b439c493bdc7635c75a051d1a5c5011363415b58d66f0ca19e8bfe9af7
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Next.js takes care of many optimizations in your React app so you don't have to

Houssein Djirdeh [X](https://twitter.com/hdjirdeh) [GitHub](https://github.com/housseindjirdeh) [Homepage](https://houssein.me/)

> [!CAUTION]
> **Caution:** One or more demos on this page no longer work, as [Glitch has ended hosting](https://blog.glitch.com/post/changes-are-coming-to-glitch).

[Next.js](https://nextjs.org/) is an opinionated [React](https://reactjs.org/)
framework with a number of performance optimizations baked in. The main idea
behind the framework is to ensure applications start and remain as performant
as possible by having these capabilities included by default.

This introduction will briefly cover many features provided by the framework
at a high level. The other guides in this collection will explore the features
in more detail.

> [!NOTE]
> **Note:** Chrome is collaborating with Next.js to improve the framework for any developer looking to build a fast, server-rendered React application. A number of newer optimizations were recently added such as [module/nomodule support](https://github.com/zeit/next.js/issues/7563) and an [improved granular chunking strategy](https://github.com/zeit/next.js/issues/7631).

## What will you learn?

Although Next.js provides a number of performance optimizations by default, these guides
aim to explain them in more detail and show you how you can use them to build a fast and
performant experience.

> [!NOTE]
> **Note:** This collection assumes that you have a basic knowledge of React. If not, check out [React's Getting Started page](https://reactjs.org/docs/getting-started.html).

There are many optimizations that can be added to React sites in general that would also
work for applications built with Next.js. These will not be covered since the focus is
on what Next.js specifically provides. To learn more about general React
optimizations, check out our [React collection](https://web.dev/react).

## How is Next.js different from React?

React is a library that makes it easier to build user interfaces using a component-based
approach. Although powerful, React is specifically a UI library. Many developers include
additional tooling such as a module bundler ([webpack](https://webpack.js.org/) for example)
and a transpiler ([Babel](https://babeljs.io/) for example) to have a complete build toolchain.

In the [React collection](https://web.dev/react), we took the approach of using [Create React App](https://create-react-app.dev/)
(CRA) to spin up React apps quickly. CRA takes the hassle out of setting up a React application
by providing a complete build toolchain with a single command.

Although there are a few default optimizations baked into CRA, the tool aims to provide a
simple and straightforward setup. The choice is given to developers to decide whether
to [eject](https://create-react-app.dev/docs/available-scripts#npm-run-eject) and
modify the configurations themselves.

Next.js, which can also be used to create a new React application, takes a different approach.
It immediately provides a number of common optimizations that many developers would like to have
but find difficult to set up, such as:

- Server-side rendering
- Automatic code-splitting
- Route prefetching
- File-system routing
- CSS-in-JS styling ([`styled-jsx`](https://github.com/zeit/styled-jsx))

## Setting up

To create a new Next.js application, run the following command:

```bash
npx create-next-app new-app
```

> [!NOTE]
> **Note:** [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) is a package runner that is installed automatically with npm 5.2.0 or later. It simplifies quite a few processes involved with managing packages including running CLI commands (like `create-next-app`) without having to install them globally on your machine.

Then navigate to the directory and start the development server:

```bash
cd new-app
npm run dev
```

> [!NOTE]
> **Note:** You can also add Next.js to an existing React application. Check out [Manual Setup](https://nextjs.org/docs#manual-setup) to learn how.

The following embed shows the directory structure of a new Next.js app.

- Click **Remix to Edit** to make the project editable.
- To preview the site, press **View App** . Then press **Fullscreen** .

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy" src="https://glitch.com/embed/#!/embed/new-next-app?attributionHidden=true&amp;sidebarCollapsed=true&amp;path=index.html&amp;previewSize=100" style="height: 100%; width: 100%; border: 0;" title="new-next-app on Glitch"></iframe>

Notice that a `pages/` directory is created with a single file: `index.jsx`. Next.js follows
a file-system routing approach, where every page within this directory is served as a separate
route. Creating a new file in this directory, such as `about.js`, will automatically create a
new route (`/about`).

Components can also be created and used like any other React application. A `components/`
directory has already been created with a single component, `nav.js`, which is already
imported in `index.js`. By default, every import used in Next.js is only fetched when that
page is loaded, providing the benefits of **automated code-splitting**.

Moreover, every initial page load in Next.js is **server-side rendered**. If you open
the Network panel in DevTools, you can see the initial request for the document returns
a fully server-rendered page.
The Preview tab of the Network panel shows that Next.js returns visually complete HTML when a page is requested.

> [!NOTE]
> **Note:** Check out [Server Rendering](https://web.dev/articles/rendering-on-the-web.md.txt#server-side_rendering) to learn how server-side rendering often results in a better experience for users.

These are only a few of the many features provided by Next.js automatically. Many
are customizable and can be modified for different use cases.

## What's next?

Pun intended 😛

Every other guide in this collection will explore a specific Next.js feature in detail:

- [Route prefetching](https://web.dev/articles/route-prefetching-in-nextjs.md.txt) to speed up page navigations
- [Serving hybrid and AMP-only pages](https://web.dev/how-amp-can-guarantee-fastness-in-your-nextjs-app) for faster loading from search engines
- [Code-splitting components with dynamic imports](https://web.dev/articles/code-splitting-with-dynamic-imports-in-nextjs.md.txt) to reduce JavaScript footprints
