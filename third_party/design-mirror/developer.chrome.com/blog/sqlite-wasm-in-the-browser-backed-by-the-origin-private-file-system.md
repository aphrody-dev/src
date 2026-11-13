---
source_url: https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:25+00:00
sha256: a6edde6c4441f3cd5454132f540a06c1816d121366feaa95bddaf8e4eef2ef5d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Use SQLite to handle all your storage needs performantly on the web.

Thomas Steiner [GitHub](https://github.com/tomayac) [LinkedIn](https://www.linkedin.com/in/thomassteinerlinkedin) [Mastodon](https://toot.cafe/@tomayac) [Bluesky](https://bsky.app/profile/tomayac.com) [Homepage](https://blog.tomayac.com/)

> [!TIP]
> **Success:** In our blog post [Deprecating and removing Web SQL](https://developer.chrome.com/blog/deprecating-web-sql.md.txt), we promised a replacement for Web SQL based on SQLite. The SQLite Wasm library with the Origin Private File System persistence backend is our fulfillment of this promise.

[SQLite](https://sqlite.org/) is a popular,
[open-source](https://sqlite.org/src/tree), lightweight, embedded relational
database management system. Many developers use it to store data in a
structured, easy-to-use manner. Because of its small size and low memory
requirements, SQLite is often leveraged as a database engine in mobile devices,
desktop applications, and web browsers.

One of the key features of SQLite is that it is a serverless database, which
means that it does not require a separate server process to operate. Instead,
the database is stored in a single file on the user's device, making it easy to
integrate into applications.

## SQLite based on Web Assembly

There are a number of unofficial SQLite versions based on Web Assembly (Wasm),
allowing it to be used in web browsers, for example,
[sql.js](https://github.com/sql-js/sql.js). The
[sqlite3 WASM/JS subproject](https://sqlite.org/wasm/doc/tip/about.md) is the
first effort that is officially associated with the
[SQLite project](https://sqlite.org/) making Wasm builds of the library
established members of the family of supported SQLite deliverables. The concrete
goals of this project include:

- Binding a low-level sqlite3 API which is as close to the C one as feasible in terms of usage.
- A higher-level object-oriented API, more akin to [sql.js](https://github.com/sql-js/sql.js/) and [Node.js-style implementations](https://www.npmjs.com/package/sqlite3), that speaks directly to the low-level API. This API must be used from the same thread as the low-level API.
- A Worker-based API which speaks to the previous APIs via Worker messages. This one is intended for use in the main thread, with the lower-level APIs installed in a Worker thread, and talking to them via Worker messages.
- A Promise-based variant of the Worker API which entirely hides the cross-thread communication aspects from the user.
- Support for persistent client-side storage using available JavaScript APIs, including the Origin Private File System (OPFS).

## Using SQLite Wasm with the Origin Private File System persistence backend

### Installing the library from npm

Install the
[@sqlite.org/sqlite-wasm](https://www.npmjs.com/package/@sqlite.org/sqlite-wasm)
package from npm with the following command:

```bash
npm install @sqlite.org/sqlite-wasm
```

### The Origin Private File System

The Origin Private File System (OPFS, part of the
[File System Access API](https://developer.chrome.com/articles/file-system-access)) is augmented with a
special surface that brings very performant access to data. This new surface
differs from existing ones by offering in-place and exclusive write access to a
file's content. This change, along with the ability to consistently read
unflushed modifications and the availability of a synchronous variant on
dedicated workers, significantly improves performance and unblocks new use
cases.

As you can imagine, the last point of the project's goals, Support for
persistent client-side storage using available JavaScript APIs, comes with
strict performance requirements regarding persisting data to the database file.
This is where the Origin Private File System, and, more specifically, the
[`createSyncAccessHandle()`](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle/createSyncAccessHandle)
method of
[`FileSystemFileHandle`](https://developer.mozilla.org/docs/Web/API/FileSystemFileHandle)
objects comes into play. This method returns a Promise which resolves to a
[`FileSystemSyncAccessHandle`](https://developer.mozilla.org/docs/Web/API/FileSystemSyncAccessHandle)
object that can be used to synchronously read from and write to a file. The
synchronous nature of this method brings performance advantages, but therefore
it is only usable inside dedicated
[Web Workers](https://developer.mozilla.org/docs/Web/API/Web_Workers_API) for
files within the Origin Private File System so the main thread can't be blocked.

### Setting the required headers

> [!WARNING]
> **Warning:** Setting these headers is a required step for the Origin Private File System persistence backend to work.

Among other files, the downloaded SQLite Wasm archive contains the `sqlite3.js`
and `sqlite3.wasm` files, which make up the sqlite3 WASM/JS build. The `jswasm`
directory contains the core sqlite3 deliverables and the top-level directory
contains demonstration and test apps. Browsers will not serve Wasm files from
`file://` URLs, so any apps you build with this require a web server and that
server must include the following headers in its response when serving the
files:

- [`Cross-Origin-Opener-Policy`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy) set to the [`same-origin` directive](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy#directives), which isolates the browsing context exclusively to same-origin documents. Cross-origin documents are not loaded in the same browsing context.
- [`Cross-Origin-Embedder-Policy`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) set to the [`require-corp` directive](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy#directives), so a document can only load resources from the same origin, or resources explicitly marked as loadable from another origin.

The reason for these headers is that SQLite Wasm depends on
[`SharedArrayBuffer`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer),
and setting these headers is part of its
[security requirements](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements).

If you inspect the traffic with DevTools, you should find the following
information:

### Speedtest

The SQLite team have run some benchmarks on their WebAssembly implementation
compared to the deprecated Web SQL. These benchmarks show that SQLite Wasm is
generally about as fast as Web SQL. Sometimes it's a little slower, sometimes
it's a little faster. See all details on the
[results page](https://googlechrome.github./io/samples/sqlite-wasm-opfs/speedtest.html).

### Getting started code sample

As mentioned previously, SQLite Wasm with the Origin Private File System
persistence backend needs to run from a Worker context. The good news is that
the library automatically takes care of all of this for you and you can use it
right from the main thread.

```javascript
import { sqlite3Worker1Promiser } from "@sqlite.org/sqlite-wasm";

(async () => {
  try {
    console.log("Loading and initializing SQLite3 module...");

    const promiser = await new Promise((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        onready: () => {
          resolve(_promiser);
        },
      });
    });

    console.log("Done initializing. Running demo...");

    let response;

    response = await promiser("config-get", {});
    console.log("Running SQLite3 version", response.result.version.libVersion);

    response = await promiser("open", {
      filename: "file:worker-promiser.sqlite3?vfs=opfs",
    });
    const { dbId } = response;
    console.log(
      "OPFS is available, created persisted database at",
      response.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, "$1"),
    );

    await promiser("exec", { dbId, sql: "CREATE TABLE IF NOT EXISTS t(a,b)" });
    console.log("Creating a table...");

    console.log("Insert some data using exec()...");
    for (let i = 20; i <= 25; ++i) {
      await promiser("exec", {
        dbId,
        sql: "INSERT INTO t(a,b) VALUES (?,?)",
        bind: [i, i * 2],
      });
    }

    console.log("Query data with exec()");
    await promiser("exec", {
      dbId,
      sql: "SELECT a FROM t ORDER BY a LIMIT 3",
      callback: (result) => {
        if (!result.row) {
          return;
        }
        console.log(result.row);
      },
    });

    await promiser("close", { dbId });
  } catch (err) {
    if (!(err instanceof Error)) {
      err = new Error(err.result.message);
    }
    console.error(err.name, err.message);
  }
})();
```

### Demo

See the above code in action in the [demo](https://googlechrome.github.io/samples/sqlite-wasm-opfs/).
Be sure to check out the
[source code](https://github.com/GoogleChrome/samples/tree/gh-pages/sqlite-wasm-opfs)
on GitHub. Note how the embedded version below does not use the OPFS backend,
but when you open the demo in a
[separate tab](https://googlechrome.github.io/samples/sqlite-wasm-opfs/) it does.
<iframe style="height: 100%; width: 100%; border: 0;" src="https://googlechrome.github.io/samples/sqlite-wasm-opfs/" allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy"></iframe>

### Debug the Origin Private File System

To debug SQLite Wasm's Origin Private File System output, use the
[OPFS Explorer](https://chrome.google.com/webstore/detail/opfs-explorer/acndjpgkpaclldomagafnognkcgjignd)
Chrome extension.

After installing the extension, open the Chrome DevTools, select the **OPFS
Explorer** tab, and you're then ready to inspect what SQLite Wasm writes to the
Origin Private File System.

If you select any of the files in the OPFS Explorer window in DevTools, you
can save it to the local disk. You can then use an app like
[SQLite Viewer](https://sqliteviewer.app/) to inspect the database, so you can
assure yourself that SQLite Wasm actually works as promised.

## Get help and provide feedback

SQLite Wasm is developed and maintained by the SQLite community. Get help and
provide feedback by searching in and posting to the
[support forum](https://sqlite.org/forum/forum). The full
[documentation](https://sqlite.org/docs.html) is available on the SQLite site.
