# Bun SQL, SQLite, Redis, S3
Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## SQL — `docs/runtime/sql.mdx`
> Bun provides native bindings for working with SQL databases through a unified Promise-based API that supports PostgreSQL, MySQL, MariaDB, and SQLite.
You write queries as tagged template literals, and the client supports connection pooling, transactions, and prepared s…
```ts
import { sql, SQL } from "bun";
const users = await sql`
 SELECT * FROM users
 WHERE active = ${true}
 LIMIT ${10}
…
```
- **Features**
### Database Support
- PostgreSQL · MySQL and MariaDB · SQLite
### Inserting data
Pass JavaScript values directly to the SQL template literal; Bun handles the escaping.
```ts
import { sql } from "bun";
const [user] = await sql`
 INSERT INTO users (name, email)
 VALUES (${name}, ${email})
 RETURNING *
…
```
- Bulk Insert · Picking columns to insert · Parameter types · `sql.json`
### Query Results
By default, Bun's SQL client returns query results as arrays of objects, where each object represents a row with column…
- `sql``.values()` format · `sql``.raw()` format · Result metadata · Column metadata
### Column name transforms
The `transform` option renames columns between the style of the database and the style of your code.
```ts
import { SQL } from "bun";
const sql = new SQL({ transform: SQL.camel });
await sql`INSERT INTO users ${sql({ firstName: "Alice", createdAt: new Date() })}`;
const [user] = await sql`SELECT first_name, created_at FROM users`;
console.log(user.firstName, user.createdAt);
```
| Preset | `user_id` in your code | Results only | Helpers only |
| - | - | - | - |
| `SQL.camel` | `userId` | `SQL.toCamel` | `SQL.fromCamel` |
| `SQL.pascal` | `UserId` | `SQL.toPascal` | `SQL.fromPascal` |
| `SQL.kebab` | `user-id` | `SQL.toKebab` | `SQL.fromKebab` |
- `column.from` renames the keys of the row objects and the `name` of each entry in `result.columns`. A function as `col
- `column.to` renames the keys of `sql(object)`, the columns that you pick in `sql(object, "a", "b")`, and every `sql("n
- Bun calls `from` once for each column of a statement, not once for each row, so it must return the same name every tim
- There is no `transform.value` or `transform.row` as in postgres.js, so the presets do not rename the keys inside `json
- With `transform.undefined`, every `undefined` parameter is that value, and the insert and update helpers leave no colu
### SQL Fragments
Bun can build queries dynamically from runtime conditions without risking SQL injection.
- Dynamic Table Names · Conditional Queries · Dynamic columns in updates · Dynamic values and `where in` · `sql.array` helper
### `sql``.simple()`
```ts
await sql`
 SELECT 1;
 SELECT 2;
`.simple();
```
Simple queries are useful for database migrations and setup scripts.
- On PostgreSQL and MySQL, the query resolves to an array with one result per statement.
- On SQLite, every statement runs and the query resolves to one result. It holds the rows of the first statement if that
- Only PostgreSQL runs the string as one implicit transaction. On MySQL and SQLite, the statements before a failing one 
- Queries in files · Unsafe Queries · Execute and Cancelling Queries · Unhandled rejections · When Bun reads parameters
### Database Environment Variables
`Bun.sql` and `new SQL()` read connection settings from environment variables.
- Precedence · Automatic Database Detection · Connection URL variables · PostgreSQL Environment Variables · MySQL and MariaDB Environment Variables · SQLite Environment Variables · Connection URL parameters
### Runtime Preconnection
Bun can preconnect to PostgreSQL at startup, before your application code runs, so the first query doesn't pay the conn…
`bun --sql-preconnect index.js DATABASE_URL=postgres://user:pass@localhost:5432/db bun --sql-preconnect index.js …`
### Connection Options
You can configure the connection manually by passing options to the `SQL` constructor.
- PostgreSQL and MySQL options · MySQL Options · PostgreSQL Options · SQLite Options · Connection callbacks
### Dynamic passwords
For alternative authentication schemes such as access tokens, or databases with rotating passwords, set `password` to a…
```ts
import { SQL } from "bun";
const sql = new SQL(url, {
 ...
 password: async () => await signer.getAuthToken(),
});
```
### SQLite-Specific Features
- Query Execution · SQLite Pragmas · Data Type Differences
### Transactions
To start a new transaction, use `sql.begin`.
- Basic Transactions · After the transaction ends · Savepoints · Distributed Transactions
### Authentication
Bun supports SCRAM-SHA-256 and SCRAM-SHA-256-PLUS (SASL), MD5, and Clear Text authentication.
- Channel binding · SSL Modes Overview · Using With Connection Strings · Custom CA Certificates · Checking the server's identity
### Connection Pooling
Bun's SQL client manages a connection pool.
```ts
const sql = new SQL({
 max: 20, // Maximum 20 concurrent connections
 idleTimeout: 30, // Close idle connections after 30s
 maxLifetime: 3600, // Max connection lifetime 1 hour
 connectionTimeout: 10, // Connection timeout 10s
…
```
- Bun starts the pool when a caller finds no connection ready: at the first query, and again after every connection has 
- `sql.begin` and `sql.reserve` need a connection of their own, so they wait for an idle one.
- Bun serves the callers that wait for a connection oldest first.
- A pool that lost some of its connections opens new ones when queries have to wait.
- When Bun cannot open a new connection, callers wait for the connections that are open. They reject with the error of t
- Bun closes a connection that goes back to the pool inside a transaction, and the server rolls that transaction back. T
- Hot reloading · Timeouts · Closing the pool
### Reserved Connections
`sql.reserve()` takes a connection from the pool and returns a client that wraps it, so you can run queries on an isola…
```ts
const reserved = await sql.reserve();
try {
 await reserved`INSERT INTO users (name) VALUES (${"Alice"})`;
} finally {
 await reserved.release();
…
```
- **After `release()`**
### LISTEN / NOTIFY (PostgreSQL)
`sql.listen()` subscribes to a PostgreSQL notification channel and `sql.notify()` publishes to one.
```ts
import { sql } from "bun";
const subscription = await sql.listen("orders", payload => {
 console.log("new order", JSON.parse(payload));
});
await sql.notify("orders", JSON.stringify({ id: 42 }));
…
```
- How it works · `notify()`
### COPY (PostgreSQL)
`COPY` moves rows in bulk.
```ts
await Bun.file("users.csv")
 .stream()
 .pipeTo(sql`COPY users (id, name) FROM STDIN (FORMAT csv)`.writable());
await Bun.write("users.csv", new Response(sql`COPY users TO STDOUT (FORMAT csv, HEADER)`.readable()));
Bun.serve({
…
```
- The streams carry bytes in the format that the statement names: `text`, `csv` or `binary`. Bun does not encode or pars
- `close()` and `pipeTo()` reject with the server's error, such as `errno` `"22P02"` for bad data. `abort()` stores noth
- Both streams apply backpressure, so memory use stays flat however large the table is.
- `COPY` takes no `${value}` parameters. `sql("name")` identifiers work.
- Call `writable()` or `readable()` before the query starts. Both start it.
- The connection runs nothing else until the `COPY` ends, so always close or abort the `WritableStream`.
### Prepared Statements
By default, Bun's SQL client creates named prepared statements for queries it can infer are static, which is faster.
`const sql = new SQL({ prepare: false, // Disable persisting named prepared statements on the server });`
- Parameter binding is still safe against SQL injection
- The server parses and plans each query from scratch
- Queries are not pipelined
- Only one command per query is supported (unless you use `sql``.simple()`)
- A query takes one more round trip when a parameter is an array, an `Int32Array`, or an object with its own `toString()
- A `Date` does not work for a `time`, `timetz`, `json` or `jsonb` parameter, because Bun sends it as ISO 8601 text with
### Error Handling
The client provides typed errors for different failure scenarios.
- Error Classes · PostgreSQL Connection Errors · PostgreSQL Authentication Errors · PostgreSQL Query Errors · PostgreSQL Data Type Errors · PostgreSQL Protocol Errors · PostgreSQL Transaction Errors · MySQL Errors · SQLite-Specific Errors
### Numbers and BigInt
Bun returns PostgreSQL `bigint` (`int8`) values, and MySQL `BIGINT` values outside the 32-bit range, as strings:
```ts
import { sql } from "bun";
const [{ x, y }] = await sql`SELECT 9223372036854777 as x, 12345 as y`;
console.log(typeof x, x); // "string" "9223372036854777"
console.log(typeof y, y); // "number" 12345
```
### BigInt Instead of Strings
To get large numbers as `BigInt` instead of strings, set the `bigint` option to `true` when creating the SQL client:
```ts
const sql = new SQL({
 bigint: true,
});
const [{ x }] = await sql`SELECT 9223372036854777 as x`;
console.log(typeof x, x); // "bigint" 9223372036854777n
```
| Adapter | Without `bigint` …| With `bigint: true` …|
| - | -…| -…|
| PostgreSQL | `int8` is a string …| Every `int8` is a `BigInt`, even `5n` …|
| MySQL / MariaDB | `BIGINT` outside the 32-bit range is a string …| `BIGINT` outside the 32-bit range is a `BigInt`. Smaller …|
| SQLite | Integers are numbers, and lose precision above 2<sup>53</…| Every integer is a `BigInt`, the same as `safeIntegers: t…|
### Dates and time zones
PostgreSQL `timestamp` and MySQL `DATETIME` / `TIMESTAMP` values have no offset on the wire.
```ts
const [row] = await sql`SELECT created_at FROM events`;
row.created_at.toISOString(); // "2024-01-15T12:00:00.000Z" on every host
```
### Roadmap
- Column type transforms
---
### Database-Specific Features
- Authentication Methods · Prepared Statements & Performance · Multiple Result Sets · Character Sets & Collations · Connection Attributes · Type Handling · Differences from PostgreSQL · MySQL-Specific Features · PostgreSQL-Specific Features · Type Handling · Typed arrays and `real` · Not implemented yet
### Common Patterns & Best Practices
- Working with MySQL Result Sets · MySQL Error Handling · Performance Tips for MySQL
### Frequently Asked Questions
The plan was to add more database drivers.
- URLs starting with `mysql://` or `mysql2://` use MySQL, and `mariadb://` uses MariaDB
- URLs matching SQLite patterns (`:memory:`, `sqlite://`, `file://`) use SQLite
- `postgres://`, `postgresql://`, and strings without a protocol use PostgreSQL
```ts
  	const results = await mysql`CALL GetUserStats(${userId}, @total_orders)`;
  	const outParam = await mysql`SELECT @total_orders as total`;
```
### Why not just use an existing library?
You can use npm packages like postgres.js, pg, and node-postgres in Bun too.
- We think it's simpler for developers to have a database driver built into Bun. The time you spend library shopping is 
- We use some JavaScriptCore engine internals to create objects faster, in ways that would be difficult to implement in 
### Credits
Huge thanks to @porsager's postgres.js for the inspiration for the API interface.

## SQLite — `docs/runtime/sqlite.mdx`
> Bun natively implements a high-performance SQLite3 driver.
Bun natively implements a high-performance SQLite3 driver.
```ts
import { Database } from "bun:sqlite";
const db = new Database(":memory:");
const query = db.query("select 'Hello world' as message;");
query.get();
```
- Transactions
- Parameters (named & positional)
- Prepared statements
- Datatype conversions (`BLOB` becomes `Uint8Array`)
- Map query results to classes without an ORM - `query.as(MyClass)`
- The fastest performance of any SQLite driver for JavaScript
### Database
`import { Database } from "bun:sqlite"; const db = new Database("mydb.sqlite");`
Bun creates the database file if it doesn't exist.
- Strict mode · Load via ES module import · `.close(throwOnError: boolean = false)` · `using` statement · `.serialize()` · `.query()`
### WAL mode
SQLite supports write-ahead log mode (WAL), which dramatically improves performance, especially with many concurrent re…
`db.run("PRAGMA journal_mode = WAL;");`
- **WAL sidecar file cleanup**
### Statements
A `Statement` is a _prepared query_, which means it's been parsed and compiled into an efficient binary form.
```ts
const query = db.query(`select "Hello world" as message`);
```
- Binding values · Names with and without the prefix · `.all()` · `.get()` · `.run()` · `.as(Class)` - Map query results to a class · `.iterate()` (`@@iterator`) · `.values()` · `.finalize()` · `.toString()`
### Parameters
Queries can contain parameters.
```ts
const query = db.query("SELECT * FROM foo WHERE bar = $bar");
const results = query.all({
 $bar: "bar",
});
```
### Integers
SQLite supports signed 64-bit integers, but JavaScript only supports signed 53-bit integers or arbitrary-precision inte…
- `safeIntegers: true` · `safeIntegers: false` (default) · `.safeIntegers()`
### Transactions
```ts
const insertCat = db.prepare("INSERT INTO cats (name) VALUES ($name)");
const insertCats = db.transaction(cats => {
 for (const cat of cats) insertCat.run(cat);
});
```
No cats have been inserted yet.
- `.loadExtension()` · `.fileControl(cmd: number, value?: number | TypedArray | null)`
### User-defined functions
- `.function()` · `.aggregate()`
### Update hooks
Set `db.onInsert`, `db.onUpdate` or `db.onDelete` to a function.
```ts
import { Database } from "bun:sqlite";
const db = new Database(":memory:");
db.run("CREATE TABLE cats (id INTEGER PRIMARY KEY, name TEXT)");
db.onInsert = (db, tableName, rowid) => {
 console.log(`inserted ${tableName} ${rowid}`);
…
```
- `database`: the `Database`. It is also `this`.
- `tableName`: the table of the row.
- `rowid`: the rowid of the row, which is also the value of an `INTEGER PRIMARY KEY` column. After an update that change
- `schemaName`: `"main"`, `"temp"`, or the name of an attached database.
- SQLite calls the hook while the statement runs, before the transaction commits. A change that you roll back later has 
- The hook cannot use its `Database`. Every call on the `Database` and on its statements throws `TypeError: This databas
### Reference
```ts
class Database {
 constructor(
  filename: string,
  options?:
   | number
…
```
- **Datatypes**

## Redis — `docs/runtime/redis.mdx`
> Use Bun's native Redis client with a Promise-based API
Bun's Redis client supports Redis server versions 7.2 and up.
```ts
import { redis } from "bun";
await redis.set("greeting", "Hello from Bun!");
const greeting = await redis.get("greeting");
console.log(greeting); // "Hello from Bun!"
await redis.set("counter", 0);
…
```
### Getting Started
```ts
import { redis, RedisClient } from "bun";
await redis.set("hello", "world");
const result = await redis.get("hello");
const client = new RedisClient("redis://username:password@localhost:6379");
await client.set("counter", "0");
…
```
By default, the client reads connection information from the following environment variables (in order of precedence):
- `REDIS_URL`
- `VALKEY_URL`
- If not set, defaults to `"redis://localhost:6379"`
- **Connection Lifecycle**
### Basic Operations
- String Operations · Numeric Operations · Hash Operations · Set Operations
### Pub/Sub
Bun provides native bindings for the Redis Pub/Sub protocol, added in Bun 1.2.23.
- Basic Usage · Publishing · Subscriptions
### Advanced Usage
- Command Execution and Pipelining · Raw Commands · Connection Events · Connection Status and Monitoring · Type Conversion
### Connection Options
```ts
const client = new RedisClient("redis://localhost:6379", {
 connectionTimeout: 5000,
 idleTimeout: 30000,
 autoReconnect: true,
 maxRetries: 10,
…
```
- **Reconnection Behavior**
### Supported URL Formats
```ts
new RedisClient("redis://localhost:6379");
new RedisClient("redis://localhost:6379");
new RedisClient("redis://username:password@localhost:6379");
new RedisClient("redis://localhost:6379/0");
new RedisClient("rediss://localhost:6379");
…
```
---
### Error Handling
```ts
try {
 await redis.get("non-existent-key");
} catch (error) {
 if (error.code === "ERR_REDIS_CONNECTION_CLOSED") {
  console.error("Connection to Redis server was closed");
…
```
- `ERR_REDIS_CONNECTION_CLOSED` - Connection to the server was closed
- `ERR_REDIS_AUTHENTICATION_FAILED` - Failed to authenticate with the server
- `ERR_REDIS_INVALID_RESPONSE` - Received an invalid response from the server
- `ERR_REDIS_SERVER_ERROR` - The server sent an error reply, either rejecting one command or, in subscriber mode, closin
---
### Example Use Cases
- Caching · Rate Limiting · Session Storage
### Implementation Notes
Bun's Redis client is implemented in Rust and uses the Redis Serialization Protocol (RESP3).
### Limitations and Future Plans
- Transactions (MULTI/EXEC) require raw commands
- Redis Sentinel
- Redis Cluster

## S3 — `docs/runtime/s3.mdx`
> Bun provides fast, native bindings for interacting with S3-compatible object storage services.
Production servers often read, upload, and write files to S3-compatible object storage services instead of the local fi…
- **Bun's S3 API is fast**
### Basic Usage
- `Bun.S3Client` & `Bun.s3` · Working with S3 Files · Reading files from S3 · Memory optimization · Writing & uploading files to S3 · Working with large files (streams)
### Presigning URLs
When your production service needs to let users upload files to your server, it's often more reliable for the user to u…
```ts
import { s3 } from "bun";
const download = s3.presign("my-file.txt"); // GET, expires in 24 hours
const upload = s3.presign("my-file", {
 expiresIn: 3600, // 1 hour
 method: "PUT",
…
```
- Setting ACLs · Expiring URLs · `method` · `new Response(S3File)`
### Support for S3-Compatible Services
Bun's S3 implementation works with any S3-compatible storage service.
- Using Bun's S3Client with AWS S3 · Using Bun's S3Client with Google Cloud Storage · Using Bun's S3Client with Cloudflare R2 · Using Bun's S3Client with DigitalOcean Spaces · Using Bun's S3Client with MinIO · Using Bun's S3Client with supabase · Using Bun's S3Client with S3 Virtual Hosted-Style endpoints
### Credentials
By default, Bun reads the following environment variables for credentials.
| Option name | Environment variable |
| - | - |
| `accessKeyId` | `S3_ACCESS_KEY_ID` |
| `secretAccessKey` | `S3_SECRET_ACCESS_KEY` |
| `region` | `S3_REGION` |
| `endpoint` | `S3_ENDPOINT` |
| `bucket` | `S3_BUCKET` |
| `sessionToken` | `S3_SESSION_TOKEN` |
| Option name | Fallback environment variable |
| - | - |
- `S3Client` objects · `S3Client.prototype.write` · `S3Client.prototype.delete` · `S3Client.prototype.exists`
### `S3File`
Calling `file()` on an `S3Client` instance, or `s3.file()`, returns an `S3File`.
```ts
interface S3File extends Blob {
 slice(start: number, end?: number): S3File;
 exists(): Promise<boolean>;
 unlink(): Promise<void>;
 presign(options: S3Options): string;
…
```
| Method | Output |
| - | - |
| `await s3File.text()` | `string` |
| `await s3File.bytes()` | `Uint8Array` |
| `await s3File.json()` | `JSON` |
| `s3File.stream()` | `ReadableStream` |
| `await s3File.arrayBuffer()` | `ArrayBuffer` |
- Partial reads with `slice` · Deleting files from S3
### Error codes
When Bun's S3 API throws an error, the error has a `code` property with one of the following values:
- `ERR_S3_MISSING_CREDENTIALS`
- `ERR_S3_INVALID_METHOD`
- `ERR_S3_INVALID_PATH`
- `ERR_S3_INVALID_ENDPOINT`
- `ERR_S3_INVALID_SIGNATURE`
- `ERR_S3_INVALID_SESSION_TOKEN`
### `S3Client` static methods
The `S3Client` class provides several static methods for interacting with S3.
- `S3Client.write` (static) · `S3Client.presign` (static) · `S3Client.list` (static) · `S3Client.exists` (static) · `S3Client.size` (static) · `S3Client.stat` (static) · `S3Client.delete` (static)
### `s3://` protocol
`fetch` and `Bun.file()` support the `s3://` protocol, so the same code works for local files and S3 files.
`const response = await fetch("s3://my-bucket/my-file.txt"); const file = Bun.file("s3://my-bucket/my-file.txt");`
- **UTF-8, UTF-16, and BOM (byte order mark)**
