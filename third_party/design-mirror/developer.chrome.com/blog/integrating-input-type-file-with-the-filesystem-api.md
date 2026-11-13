---
source_url: https://developer.chrome.com/blog/integrating-input-type-file-with-the-filesystem-api
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:33+00:00
sha256: 4afea95c1b1eb77ba463a0f315c7095d7e047168d0304d2dcbb3be6e44a2cf6b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Eric Bidelman [X](https://twitter.com/ebidel) [GitHub](https://github.com/ebidel) [Homepage](http://ericbidelman.com/)

Let's say you have a photo editing app and you'd like users to be able to drag in hundreds of photos and copy them into your app. Ok, what do you do?
 [Launch Demo](http://html5-demos.appspot.com/static/dnd/all_types_of_import.html)

In a [recent post](https://developer.chrome.com/blog/drag-and-drop-a-folder-onto-chrome-now-available.md.txt), [Eiji Kitamura](https://developer.chrome.com/authors/agektmr) highlighted a subtle, yet powerful new feature in the drag and drop APIs; the ability to drag in folders *and* retrieve them as HTML5 Filesystem API `FileEntry` and `DirectoryEntry` objects (done by accessing a new method on the [DataTransferItem](https://html.spec.whatwg.org/multipage/dnd.html#datatransferitem), `.webkitGetAsEntry()`).

What's remarkably cool about the `.webkitGetAsEntry()` extension is how elegant it makes importing files and entire folders. Once you have a `FileEntry` or `DirectoryEntry` from a drop event, it's a matter of using the Filesystem API's `copyTo()` to get it imported into your app.

An example of copying multiple dropped folders over to the filesystem:

```javascript
var fs = null; // Cache filesystem for later.

// Not shown: setup drag and drop event listeners.
function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    var items = e.dataTransfer.items;

    for (var i = 0, item; item = items[i]; ++i) {
    var entry = item.webkitGetAsEntry();

    // Folder? Copy the DirectoryEntry over to our local filesystem.
    if (entry.isDirectory) {
        entry.copyTo(fs.root, null, function(copiedEntry) {
        // ...
        }, onError);
    }
    }
}

window.webkitRequestFileSystem(TEMPORARY, 1024 * 1204, function(fileSystem) {
    fs = fileSystem;
}, function(e) {
    console.log('Error', e);
});
```

Very nice! Again, the simplicity comes from integrating DnD with the Filesystem API calls.

Taking this one step further, we also have the ability to drag and drop a folder and/or files onto a normal `<input type="file">`, then access the entries as Filesystem directory or file entries. That is done through `.webkitEntries`:

```html
<input type="file" multiple>
```

```javascript
function onChange(e) {
    e.stopPropagation();
    e.preventDefault();

    var entries = e.target.webkitEntries; // Get all dropped items as FS API entries.

    [].forEach.call(entries, function(entry) {

    // Copy the entry into our local filesystem.
    entry.copyTo(fs.root, null, function(copiedEntry) {
        ...
    }, onError);

    });
}

document.querySelector('input[type="file"]').addEventListener('change', onChange);
```

I've put together a photo gallery demo to demonstrate these different techniques for importing files/folders.

[Launch Demo](http://html5-demos.appspot.com/static/dnd/all_types_of_import.html)

To learn more about the HTML5 Filesystem API, see [Exploring the Filesystem APIs](https://www.html5rocks.com/tutorials/file/filesystem/).
