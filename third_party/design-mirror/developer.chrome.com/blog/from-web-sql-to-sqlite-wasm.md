---
source_url: https://developer.chrome.com/blog/from-web-sql-to-sqlite-wasm
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:25+00:00
sha256: fc85669e5ecbbc19d83d227ac310e53c2bf1638fe4aefbdf846774022ad62e6d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

With SQLite Wasm backed by the origin private file system, there is a versatile replacement for the deprecated Web SQL database technology. This article is a guide to migrating your data from Web SQL to SQLite Wasm.

Thomas Steiner [GitHub](https://github.com/tomayac) [LinkedIn](https://www.linkedin.com/in/thomassteinerlinkedin) [Mastodon](https://toot.cafe/@tomayac) [Bluesky](https://bsky.app/profile/tomayac.com) [Homepage](https://blog.tomayac.com/)

## Required background

The post [Deprecating and removing Web SQL](https://developer.chrome.com/blog/deprecating-web-sql.md.txt) announced the deprecation of the Web SQL database technology. While the technology itself may be deprecated, the use cases addressed by the technology very much are not, so the follow-up post [SQLite Wasm in the browser backed by the Origin Private File System](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system.md.txt), outlines a replacement set of technologies based on the [SQLite](https://sqlite.org/) database, [compiled to Web Assembly](https://sqlite.org/wasm) (Wasm), and backed by the [origin private file system](https://developer.mozilla.org/docs/Web/API/File_System_Access_API#origin_private_file_system). To close the circle, this article shows how to migrate databases over from Web SQL to SQLite Wasm.

## Migrating your databases

The following four steps demonstrate the conceptual idea of migrating a Web SQL database over to SQLite Wasm, with the SQLite database backed by the origin private file system. This can serve as the foundation for your own code customized to _your_ Web SQL migration needs.

> [!TIP]
> **Success:** The SQLite team have run some benchmarks on their WebAssembly implementation compared to the deprecated Web SQL. These benchmarks show that SQLite Wasm is generally about as fast as Web SQL. Sometimes it's a little slower, sometimes it's a little faster. See all details on the [results page](https://googlechrome.github.io/samples/sqlite-wasm-opfs/speedtest.html).

### The to-be-migrated Web SQL database(s)

The baseline assumption of this migration guide is that you have one (or several) existing Web SQL databases that hold data relevant to your app. In the screenshot below, you see an example database called _mydatabase_ with a rainstorms table that maps moods to severities. Chrome DevTools allow you to [view Web SQL databases for debugging](https://developer.chrome.com/docs/devtools/storage/websql.md.txt#view), as shown in the following screenshot.

### Translating the Web SQL database to SQL statements

To migrate the data in a way that is transparent to the user, that is, without requiring them to perform any of the migration steps on their own, the pieces of data in the database need to be translated back to the original SQL statements that created them in the first place. This challenge has come up before, and the migration script used in this article---[`mywebsqldump.js`](https://github.com/GoogleChrome/samples/blob/gh-pages/web-sql-to-sqlite-wasm/mywebsqldump.js)---is based on a community library called [`websqldump.js`](https://github.com/sdesalas/websqldump), with some minor adjustments. The following code sample shows the code required to translate the Web SQL database _mydatabase_ to a set of SQL statements.

```javascript
websqldump.export({
  database: "mydatabase",
  version: "1.0",
  success: function (sql) {
    // The SQL statements.
  },
  error: function (err) {
    // Handle the error.
  },
});
```

Running this code results in the SQL statements string below.

```sql
CREATE TABLE IF NOT EXISTS rainstorms (mood text, severity int);
INSERT INTO rainstorms(mood,severity) VALUES ('somber','6');
INSERT INTO rainstorms(mood,severity) VALUES ('rainy','8');
INSERT INTO rainstorms(mood,severity) VALUES ('stormy','2');
```

> [!WARNING]
> **Warning:** The outlined steps show the conceptual idea tested on a small database. For migrating production-size databases, additional performance tuning steps may be necessary. For example, preprocessing the SQL statements string. One optimization would be to group the `INSERT` statements: `INSERT INTO rainstorms VALUES ('somber',6), ('rainy',8), ('stormy',2)`. You may also have to further patch `mywebsqldump.js`, so it correctly deals with corner cases present in _your_ Web SQL data.

### Importing the data into SQLite Wasm

All that remains is executing these SQL commands in the context of SQLite Wasm. For all details regarding setting SQLite Wasm up, I refer you to the article [SQLite Wasm in the browser backed by the Origin Private File System](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system.md.txt), but the gist is again below. Remember that this code needs to run in a Worker (that the library automatically creates for you), with the [required HTTP headers](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system.md.txt#setting_the_required_headers) set correctly. You can install the [`@sqlite.org/sqlite-wasm`](https://www.npmjs.com/package/@sqlite.org/sqlite-wasm) package from npm.

```javascript
import { sqlite3Worker1Promiser } from "@sqlite.org/sqlite-wasm";

(async () => {
  try {
    const promiser = await new Promise((resolve) => {
      const _promiser = sqlite3Worker1Promiser({
        onready: () => {
          resolve(_promiser);
        },
      });
    });

    let response;

    response = await promiser("open", {
      filename: "file:mydatabase.db?vfs=opfs",
    });
    const { dbId } = response;

    const sql = `
      CREATE TABLE IF NOT EXISTS rainstorms (mood text, severity int);
      INSERT INTO rainstorms(mood,severity) VALUES ('somber','6');
      INSERT INTO rainstorms(mood,severity) VALUES ('rainy','8');
      INSERT INTO rainstorms(mood,severity) VALUES ('stormy','2');`;
    await promiser("exec", { dbId, sql });

    await promiser("close", { dbId });
  } catch (err) {
    if (!(err instanceof Error)) {
      err = new Error(err.result.message);
    }
    console.error(err.name, err.message);
  }
})();
```

After running this code, inspect the imported database file with the [OPFS Explorer](https://chrome.google.com/webstore/detail/opfs-explorer/acndjpgkpaclldomagafnognkcgjignd) Chrome DevTools extension. There are two files now, one with the actual database, and one with journaling information. Note that these two files live in the origin private file system, so you need to use the OPFS Explorer extension to see them.

To actually verify that the imported data is the same as the initial Web SQL data, click the file `mydatabase.db` and the OPFS Explorer extension will show a **Save File** dialog to let you save the file in the user-visible file system. With the database file saved, use a SQLite viewer app to explore the data. The [Project Fugu API Showcase](https://developer.chrome.com/fugu-showcase) features several [apps for working with SQLite in the browser](https://developer.chrome.com/fugu-showcase#sqlite). For example, [Sqlime --- SQLite Playground](https://sqlime.org/) lets you open a SQLite database file from your hard disk and run queries on the database. As you see in the screenshot below, the rainstorm table has been correctly imported into SQLite.

### Freeing Web SQL storage

While it's (maybe surprisingly) [impossible to delete a Web SQL database](https://www.w3.org/TR/webdatabase/#:%7E:text=There%20is%20no%20way%20to%20enumerate%20or%20delete%20the%20databases%20available%20for%20an%20origin%20from%20this%20API.), you should still free some storage by dropping the now obsolete Web SQL tables after you have migrated the data into SQLite Wasm. To list all tables in a Web SQL database and drop them using JavaScript, use code as in the following snippet:

```javascript
const dropAllTables = () => {
  try {
    db.transaction(function (tx) {
      tx.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name !='__WebKitDatabaseInfoTable__'",
        [],
        function (tx, result) {
          const len = result.rows.length;
          const tableNames = [];
          for (let i = 0; i < len; i++) {
            const tableName = result.rows.item(i).name;
            tableNames.push(`'${tableName}'`);
            db.transaction(function (tx) {
              tx.executeSql("DROP TABLE " + tableName);
            });
          }
          console.log(
            `Dropped table${tableNames.length > 1 ? "s" : ""}: ${tableNames.join(", ")}.`,
          );
        },
      );
    });
  } catch (err) {
    console.error(err.name, err.message);
  }
};
```

### Working with the data after the migration

After you have migrated the data, work with the data as outlined in this [Getting started code sample](https://developer.chrome.com/blog/sqlite-wasm-in-the-browser-backed-by-the-origin-private-file-system.md.txt#getting_started_code_sample). See the [SQLite Wasm API reference](https://sqlite.org/wasm/doc/trunk/api-index.md) for details. Again a reminder that you need to access SQLite Wasm from a Worker if you use the origin private file system as your storage backend.

## Conclusions

Migrating your Web SQL databases to SQLite Wasm backed by the origin private file system is possible in a way transparent to your users. They will not notice that their data is now hosted in the origin private file system in a SQLite database, and no longer lives in Web SQL. Overall, migrating from Web SQL to SQLite is a necessary step for web developers who want to ensure the long-term stability and scalability of their applications. While the process may require some initial effort, the benefits of a more robust, flexible, and, above all, future-proof database solution make it well worth the investment.
