# Bun.serve, WebSocket, fetch, TCP/UDP/DNS, cookies
Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## Cookies — `docs/runtime/http/cookies.mdx`
> Work with cookies in HTTP requests and responses using Bun's built-in Cookie API.
Bun has a built-in API for working with cookies in HTTP requests and responses.
### Reading cookies
```ts
Bun.serve({
 routes: {
  "/profile": req => {
   const userId = req.cookies.get("user_id");
   const theme = req.cookies.get("theme") || "light";
…
```
### Setting cookies
To set cookies, use the `set` method on the `CookieMap` from the `BunRequest` object.
```ts
Bun.serve({
 routes: {
  "/login": req => {
   const cookies = req.cookies;
   cookies.set("user_id", "12345", {
…
```
### Deleting cookies
```ts
Bun.serve({
 routes: {
  "/logout": req => {
   req.cookies.delete("user_id", {
    path: "/",
…
```
Deleted cookies become a `Set-Cookie` header on the response with the `Expires` attribute set to a date in the past and…

## Error Handling — `docs/runtime/http/error-handling.mdx`
> Learn how to handle errors in Bun's development server
`Bun.serve()` runs in development mode by default.
```ts
Bun.serve({
 development: false, // [!code ++]
 fetch(req) {
  throw new Error("woops!");
 },
…
```
- **`error` callback**
To handle server-side errors, implement an `error` handler.
```ts
Bun.serve({
 fetch(req) {
  throw new Error("woops!");
 },
 error(error) {
…
```

## Metrics — `docs/runtime/http/metrics.mdx`
> Monitor server activity with built-in metrics
- **`server.pendingRequests` and `server.pendingWebSockets`**
```ts
const server = Bun.serve({
 fetch(req, server) {
  return new Response(
   `Active requests: ${server.pendingRequests}\n` + `Active WebSockets: ${server.pendingWebSockets}`,
  );
…
```
- **`server.subscriberCount(topic)`**
```ts
const server = Bun.serve({
 fetch(req, server) {
  const chatUsers = server.subscriberCount("chat");
  return new Response(`${chatUsers} users in chat`);
 },
…
```

## Routing — `docs/runtime/http/routing.mdx`
> Define routes in `Bun.serve` using static paths, parameters, and wildcards
Add routes to `Bun.serve()` with the `routes` property (static paths, parameters, and wildcards), or handle unmatched r…
### Basic Setup
```ts
Bun.serve({
 routes: {
  "/": () => new Response("Home"),
  "/api": () => Response.json({ success: true }),
  "/users": async () => Response.json({ users: [] }),
…
```
Routes in `Bun.serve()` receive a `BunRequest` (which extends `Request`) and return a `Response` or `Promise`.
### Asynchronous Routes
- **Async/await**
Use async/await in route handlers to return a `Promise`.
```ts
import { sql, serve } from "bun";
serve({
 port: 3001,
 routes: {
  "/api/version": async () => {
…
```
- **Promise**
You can also return a `Promise` from a route handler.
```ts
import { sql, serve } from "bun";
serve({
 routes: {
  "/api/version": () => {
   return new Promise(resolve => {
…
```
### Route precedence
- Exact routes (`/users/all`)
- Parameter routes (`/users/:id`)
- Wildcard routes (`/users/*`)
- Global catch-all (`/*`)
```ts
Bun.serve({
 routes: {
  "/api/users/me": () => new Response("Current user"),
  "/api/users/:id": req => new Response(`User ${req.params.id}`),
  "/api/*": () => new Response("API catch-all"),
…
```
---
### Type-safe route parameters
TypeScript parses route parameters when passed as a string literal, so your editor shows autocomplete when accessing `r…
```ts
import type { BunRequest } from "bun";
Bun.serve({
 routes: {
  "/orgs/:orgId/repos/:repoId": req => {
   const { orgId, repoId } = req.params;
…
```
- **Static responses**
Routes can also be `Response` objects (without the handler function).
```ts
Bun.serve({
 routes: {
  "/health": new Response("OK"),
  "/ready": new Response("Ready", {
   headers: {
…
```
- **File Responses vs Static Responses**
Serving a file from a route behaves differently depending on whether you buffer the file content or serve it directly:
```ts
Bun.serve({
 routes: {
  "/logo.png": new Response(await Bun.file("./logo.png").bytes()),
  "/download.zip": new Response(Bun.file("./download.zip")),
 },
…
```
- **Zero filesystem I/O** during requests - content served entirely from memory
- **ETag support** - Automatically generates and validates ETags for caching
- **If-None-Match** - Returns `304 Not Modified` when client ETag matches
- **No 404 handling** - Missing files cause startup errors, not runtime 404s
- **Memory usage** - Full file content stored in RAM
- **Best for**: Small static assets, API responses, frequently accessed files
- **Directory routes**
To serve an entire directory tree at a URL prefix, pass `{ dir }` as the route value.
```ts
Bun.serve({
 routes: {
  "/static/*": { dir: "./public" },
 },
});
```
- A `..` stops at `dir`.
- An absolute target starts from `dir`. A symlink to `/var/data/logo.png` serves `var/data/logo.png` in `dir`, or is a `
- **Content-Type** is set from the file extension.
- **Last-Modified** and a weak `ETag` (`W/"-"`) are sent on every response, and `If-Modified-Since` / `If-None-Match` ar
- **Range requests** are supported with `Accept-Ranges: bytes` and `Content-Range`. `If-Range` is honored with the `Last
- A request that resolves to a directory without a trailing `/` receives a `301` redirect to the trailing-slash URL. Wit
### Streaming files
To stream a file, return a `Response` object with a `BunFile` object as the body.
```ts
Bun.serve({
 fetch(req) {
  return new Response(Bun.file("./hello.txt"));
 },
});
```
### `fetch` request handler
The `fetch` handler runs for incoming requests that no route matched.
```ts
Bun.serve({
 fetch(req) {
  const url = new URL(req.url);
  if (url.pathname === "/") return new Response("Home page!");
  if (url.pathname === "/blog") return new Response("Blog!");
…
```

## Server — `docs/runtime/http/server.mdx`
> Use `Bun.serve` to start a high-performance HTTP server in Bun
### Basic Setup
```ts
const server = Bun.serve({
 routes: {
  "/api/status": new Response("OK"),
  "/users/:id": req => {
   return new Response(`Hello User ${req.params.id}!`);
…
```
---
### HTML imports
Import HTML files directly into your server code to build full-stack applications with both server-side and client-side…
```ts
import myReactSinglePageApp from "./index.html";
Bun.serve({
 routes: {
  "/": myReactSinglePageApp,
 },
…
```
### Configuration
- **Changing the `port` and `hostname`**
To configure which port and hostname the server listens on, set `port` and `hostname` in the options object.
```ts
Bun.serve({
 port: 8080, // defaults to $BUN_PORT, $PORT, $NODE_PORT otherwise 3000 // [!code ++]
 hostname: "mydomain.com", // defaults to "0.0.0.0" // [!code ++]
 fetch(req) {
  return new Response("404!");
…
```
- **Configuring a default port**
Several flags and environment variables set the default port, which Bun uses when the `port` option is not set.
- `--port` CLI flag
`bun --port=4002 server.ts`
- `BUN_PORT` environment variable
- `PORT` environment variable
- `NODE_PORT` environment variable
### Unix domain sockets
To listen on a unix domain socket, pass the `unix` option with the path to the socket.
```ts
Bun.serve({
 unix: "/tmp/my-socket.sock", // path to socket
 fetch(req) {
  return new Response(`404!`);
 },
…
```
- **Abstract namespace sockets**
```ts
Bun.serve({
 unix: "\0my-abstract-socket", // abstract namespace socket
 fetch(req) {
  return new Response(`404!`);
 },
…
```
Unlike unix domain sockets, abstract namespace sockets are not bound to the filesystem and are automatically removed wh…
### HTTP/3 (QUIC)
HTTP/3 support in `Bun.serve` is **experimental** and may change in future releases.
```ts
Bun.serve({
 tls: {
  key: Bun.file("./key.pem"),
  cert: Bun.file("./cert.pem"),
 },
…
```
### HTTP/2
HTTP/2 support in `Bun.serve` is **experimental** and may change in future releases.
```ts
Bun.serve({
 tls: {
  key: Bun.file("./key.pem"),
  cert: Bun.file("./cert.pem"),
 },
…
```
### idleTimeout
By default, `Bun.serve` closes connections after **10 seconds** of inactivity.
```ts
Bun.serve({
 idleTimeout: 30,
 fetch(req) {
  return new Response("Bun!");
 },
…
```
### export default syntax
Instead of passing the server options into `Bun.serve`, you can `export default` them.
```ts
import type { Serve } from "bun";
export default {
 fetch(req) {
  return new Response("Bun!");
 },
…
```
### Hot Route Reloading
```ts
const server = Bun.serve({
 routes: {
  "/api/version": () => Response.json({ version: "1.0.0" }),
 },
});
…
```
---
### Server Lifecycle Methods
- **`server.stop()`**
```ts
const server = Bun.serve({
 fetch(req) {
  return new Response("Hello!");
 },
});
…
```
By default, `stop()` allows in-flight requests and WebSocket connections to complete.
- **`server.closeIdleConnections()`**
To close keep-alive connections that are not currently serving a request, without stopping the server:
```ts
const closed = server.closeIdleConnections();
console.log(`closed ${closed} idle connections`);
```
- **`server.ref()` and `server.unref()`**: `server.unref(); server.ref();`
- **`server.reload()`**
```ts
const server = Bun.serve({
 routes: {
  "/api/version": Response.json({ version: "v1" }),
 },
 fetch(req) {
…
```
Use this for development and hot reloading.
### Per-Request Controls
- **`server.timeout(Request, seconds)`**
Override the idle timeout for an individual request.
```ts
const server = Bun.serve({
 async fetch(req, server) {
  server.timeout(req, 60);
  await req.text();
  return new Response("Done!");
…
```
- **`server.requestIP(Request)`**
```ts
const server = Bun.serve({
 fetch(req, server) {
  const address = server.requestIP(req);
  if (address) {
   return new Response(`Client IP: ${address.address}, Port: ${address.port}`);
…
```
Returns `null` for closed requests or Unix domain sockets.
### Server Metrics
- **`server.pendingRequests` and `server.pendingWebSockets`**
```ts
const server = Bun.serve({
 fetch(req, server) {
  return new Response(
   `Active requests: ${server.pendingRequests}\n` + `Active WebSockets: ${server.pendingWebSockets}`,
  );
…
```
- **`server.subscriberCount(topic)`**
```ts
const server = Bun.serve({
 fetch(req, server) {
  const chatUsers = server.subscriberCount("chat");
  return new Response(`${chatUsers} users in chat`);
 },
…
```
---
### Benchmarks
The following Bun and Node.js servers respond `Bun!` to each incoming `Request`.
```ts
Bun.serve({
 fetch(req: Request) {
  return new Response("Bun!");
 },
 port: 3000,
…
```
| Runtime | Requests per second |
| - | - |
| Node 16 | ~64,000 |
| Bun | ~160,000 |
### Practical example: REST API
```ts
import type { Post } from "./types.ts";
import { Database } from "bun:sqlite";
const db = new Database("posts.db");
db.run(`
 CREATE TABLE IF NOT EXISTS posts (
…
```
---
### Reference
```ts
interface Server extends Disposable {
 stop(closeActiveConnections?: boolean): Promise<void>;
 closeIdleConnections(): number;
 reload(options: Serve.Options<undefined>): Server;
 fetch(request: Request | string): Response | Promise<Response>;
…
```

## TLS — `docs/runtime/http/tls.mdx`
> Enable TLS in Bun.serve
Bun's TLS support is built in, powered by BoringSSL.
```ts
Bun.serve({
 tls: {
  key: Bun.file("./key.pem"), // [!code ++]
  cert: Bun.file("./cert.pem"), // [!code ++]
 },
…
```
- **Passphrase**
If your private key is encrypted with a passphrase, provide a value for `passphrase` to decrypt it.
```ts
Bun.serve({
 tls: {
  key: Bun.file("./key.pem"),
  cert: Bun.file("./cert.pem"),
  passphrase: "my-secret-passphrase", // [!code ++]
…
```
- **CA Certificates**
Pass `ca` to override the trusted CA certificates.
```ts
Bun.serve({
 tls: {
  key: Bun.file("./key.pem"), // path to TLS key
  cert: Bun.file("./cert.pem"), // path to TLS cert
  ca: Bun.file("./ca.pem"), // path to root CA certificate  // [!code ++]
…
```
- **Client certificates (mTLS)**
A server asks clients for a certificate only when `requestCert` is `true`.
```ts
Bun.serve({
 tls: {
  key: Bun.file("./key.pem"),
  cert: Bun.file("./cert.pem"),
  ca: Bun.file("./client-ca.pem"), // CA that issues the client certificates
…
```
- **Certificate revocation lists**
Pass `crl` to refuse peer certificates that a CA has revoked.
```ts
Bun.serve({
 tls: {
  key: Bun.file("./key.pem"),
  cert: Bun.file("./cert.pem"),
  ca: Bun.file("./client-ca.pem"),
…
```
- **Diffie-Hellman**
```ts
Bun.serve({
 tls: {
  dhParamsFile: "/path/to/dhparams.pem", // path to Diffie Hellman parameters // [!code ++]
 },
});
```
---
### Server name indication (SNI)
To configure the server name indication (SNI) for the server, set the `serverName` field in the `tls` object.
```ts
Bun.serve({
 tls: {
  serverName: "my-server.com", // SNI // [!code ++]
 },
});
```

## WebSockets — `docs/runtime/http/websockets.mdx`
> Server-side WebSockets in Bun
`Bun.serve()` supports server-side WebSockets, with on-the-fly compression, TLS support, and a Bun-native publish-subsc…
| **Messages sent per second** | **Runtime** | **Clients** |
| - | - | - |
| ~700,000 | (`Bun.serve`) Bun v0.2.1 (x64) | 16 |
| ~100,000 | (`ws`) Node v18.10.0 (x64) | 16 |
### Start a WebSocket server
The following server, built with `Bun.serve`, upgrades every incoming request to a WebSocket connection in the `fetch` …
```ts
Bun.serve({
 fetch(req, server) {
  if (server.upgrade(req)) {
   return; // do not return a Response
  }
…
```
- Time spent adding/removing event listeners for each connection adds up
- Extra memory spent on storing references to callback functions for each connection
- Usually, people create new functions for each connection, which also means more memory
- **Sending messages**
Each `ServerWebSocket` instance has a `.send()` method for sending messages to the client.
```ts
Bun.serve({
 fetch(req, server) {}, // upgrade logic
 websocket: {
  message(ws, message) {
   ws.send("Hello world"); // string
…
```
- **Headers**
Once the upgrade succeeds, Bun sends a `101 Switching Protocols` response per the spec.
```ts
Bun.serve({
 async fetch(req, server) {
  const sessionId = await generateSessionId();
  server.upgrade(req, {
   headers: { // [!code ++]
…
```
- **Contextual data**
Attach contextual `data` to a new WebSocket in the `.upgrade()` call.
```ts
type WebSocketData = {
 createdAt: number;
 channelId: string;
 authToken: string;
};
…
```
- **Pub/Sub**
Bun's `ServerWebSocket` includes a native publish-subscribe API for topic-based broadcasting.
```ts
const server = Bun.serve({
 fetch(req, server) {
  const url = new URL(req.url);
  if (url.pathname === "/chat") {
   console.log(`upgrade!`);
…
```
- **Compression**
Enable per-message compression with the `perMessageDeflate` parameter.
```ts
Bun.serve({
 fetch(req, server) {}, // upgrade logic
 websocket: {
  perMessageDeflate: true, // [!code ++]
 },
…
```
| Value | `compress` | `decompress` …|
| - | - | -…|
| `"shared"`, `true` | One compressor for all sockets, reset after each message | One decompressor for all sockets …|
| `"3KB"` ... `"256KB"` | Per-socket compressor that keeps context across messages | Per-socket decompressor with that window size (max 32 KB)…|
| `"dedicated"` | Same as `"256KB"` | Same as `"32KB"` …|
| `"disable"`, `false` | Never compress, even if `send()` passes `true` | No per-socket decompressor. Uses `"shared"` if `compress`…|
- **Backpressure**
The `.send(message)` method of `ServerWebSocket` returns a `number` indicating the result of the operation.
- `-1` — The message was enqueued but there is backpressure
- `0` — The message was dropped because the connection is closed or already has more than `backpressureLimit` bytes buff
- `1+` — The number of bytes sent
```ts
Bun.serve({
 fetch(req, server) {}, // upgrade logic
 websocket: {
  message(ws, message) {
   if (!file.write(message)) {
…
```
- **Closing connections**
`ws.close(code, reason)` sends a Close frame and then closes the connection.
`ws.close(); // 1000 ws.close(1011, "Something went wrong"); ws.terminate(); // no Close frame`
- Clients only accept `1000`-`1003`, `1007`-`1014` and `3000`-`4999`. A browser that receives any other code reports `10
- `0`, `1005` and `1006` send a Close frame with no code, so you can forward the code from a `close` handler to another 
- The reason is truncated to 123 bytes of UTF-8.
- **Errors**
When a handler throws, Bun calls the `error` handler with the error and the socket.
```ts
Bun.serve({
 fetch(req, server) {}, // upgrade logic
 websocket: {
  message(ws, message) {
   throw new Error("oops");
…
```
- **Timeouts and limits**
By default, Bun closes a WebSocket connection that has been idle for 120 seconds.
```ts
Bun.serve({
 fetch(req, server) {}, // upgrade logic
 websocket: {
  idleTimeout: 60, // 60 seconds  // [!code ++]
 },
…
```
| Option | Default | Range | `0` means |
| - | - | - | - |
| `idleTimeout` | 120 s | `0` to `960` | No timeout, no automatic pings |
| `maxPayloadLength` | 16 MB | `0` to `2^32 - 1` | Only empty messages are accepted |
| `backpressureLimit` | 16 MB | `0` to `2^32 - 1` | No limit |
### Connect to a `WebSocket` server
Bun implements the `WebSocket` class.
`const socket = new WebSocket("ws://localhost:3000"); const socket2 = new WebSocket("ws://localhost:3000", ["soap", "wamp"]);`
- **Backpressure**
```ts
const socket = new WebSocket("ws://localhost:3000");
socket.addEventListener("message", event => {
 if (!file.write(event.data)) {
  socket.pause();
  file.once("drain", () => socket.resume());
…
```
`pause()` and `resume()` return `true` when they took effect (or will, once a connecting socket opens) and `false` when…
### Reference
See the API reference for `WebSocketHandler` (the `websocket` option), `ServerWebSocket`, `Server` and the `WebSocket` …

## DNS — `docs/runtime/networking/dns.mdx`
> Use Bun's DNS module to resolve DNS records
Bun implements its own `dns` module and the `node:dns` module.
```ts
import * as dns from "node:dns";
const addrs = await dns.promises.resolve4("bun.com", { ttl: true });
console.log(addrs);
// => [{ address: "172.67.161.226", ttl: 0 }, ...]
```
### Choosing a resolver backend
- `"c-ares"`: the c-ares asynchronous resolver. It reads `/etc/resolv.conf` directly, so it does not consult NSS modules
- `"system"`: the platform's own resolver (the non-blocking system API on macOS, `getaddrinfo` on a thread pool everywhe
- `"getaddrinfo"` (alias `"libc"`): the POSIX `getaddrinfo(3)` function on a thread pool.
`import { dns } from "bun"; const [{ address }] = await dns.lookup("example.com", { backend: "system" });`
`node:dns.lookup()` always uses the `"system"` backend to match Node.js, whose `dns.lookup()` is documented as calling …
### DNS caching in Bun
Bun caches DNS lookups, which makes repeated connections to the same hosts faster.
- `bun install`
- `fetch()`
- `node:http` (client)
- `Bun.connect`
- `node:net`
- `node:tls`
- **When should I prefetch a DNS entry?**
Web browsers expose `` to resolve a hostname before it's needed.
`import { dns } from "bun"; dns.prefetch("my.database-host.com", 5432);`
- **`dns.prefetch`**
This API is experimental and may change in the future.
`dns.prefetch(hostname: string, port?: number): void;`
- **`dns.getCacheStats()`**
This API is experimental and may change in the future.
```ts
{
 cacheHitsCompleted: number; // Cache hits completed
 cacheHitsInflight: number; // Cache hits in flight
 cacheMisses: number; // Cache misses
 size: number; // Number of items in the DNS cache
…
```
- **Configuring DNS cache TTL**
Bun caches DNS entries for 30 seconds by default.
`BUN_CONFIG_DNS_TIME_TO_LIVE_SECONDS=5 bun run my-script.ts`
- **Why is 30 seconds the default?**

## Fetch — `docs/runtime/networking/fetch.mdx`
> Send HTTP requests with Bun's fetch API
Bun implements the WHATWG `fetch` standard, with some extensions to meet the needs of server-side JavaScript.
### Sending an HTTP request
`const response = await fetch("http://example.com"); console.log(response.status); // => 200 const text = await response.text(); // or response.json(), response.formData(), etc.`
`fetch` also works with HTTPS URLs.
- **Sending a POST request**
To send a POST request, pass an object with the `method` property set to `"POST"`.
```ts
const response = await fetch("http://example.com", {
 method: "POST",
 body: "Hello, world!",
});
```
- **Proxying requests**
To proxy a request, pass an object with the `proxy` property set to a URL string, a `URL` instance, or to an object who…
`const response = await fetch("http://example.com", { proxy: "http://proxy.com", });`
| Entry | Matches |
| - | - |
| `*` | every host |
| `example.com`, `.example.com`, `*.example.com` | `example.com` and its subdomains |
| `127.0.0.1`, `::1`, `[::1]` | that IP address |
| `10.0.0.0/8`, `fd00::/8` | every IP address in the block |
| `example.com:8080` | the host, on that port only |
- **Custom headers**
To set custom headers, pass an object with the `headers` property set to an object.
```ts
const response = await fetch("http://example.com", {
 headers: {
  "X-Custom-Header": "value",
 },
});
```
- **Response bodies**
- `response.text(): Promise`: Returns a promise that resolves with the response body as a string.
- `response.json(): Promise`: Returns a promise that resolves with the response body as a JSON object.
- `response.formData(): Promise`: Returns a promise that resolves with the response body as a `FormData` object.
- `response.bytes(): Promise`: Returns a promise that resolves with the response body as a `Uint8Array`.
- `response.arrayBuffer(): Promise`: Returns a promise that resolves with the response body as an `ArrayBuffer`.
- `response.blob(): Promise`: Returns a promise that resolves with the response body as a `Blob`.
- Streaming response bodies · Streaming request bodies
```ts
const stream = new ReadableStream({
 start(controller) {
  controller.enqueue("Hello");
  controller.enqueue(" ");
  controller.enqueue("World");
…
```
- Bun streams the data directly to the network without buffering the entire body in memory
- If the connection is lost, Bun cancels the stream
- Bun sets the `Content-Length` header automatically only when the stream has a known size
- For PUT/POST requests, Bun automatically uses multipart upload
- Bun consumes the stream in chunks and uploads the chunks in parallel
- You can monitor progress through the S3 options
- **Fetching a URL with a timeout**: `const response = await fetch("http://example.com", { signal: AbortSignal.timeout(1000), });`
- Canceling a request · Unix domain sockets
```ts
const response = await fetch("https://hostname/a/path", {
 unix: "/var/run/path/to/unix.sock",
 method: "POST",
 body: JSON.stringify({ message: "Hello from Bun!" }),
 headers: {
…
```
- **TLS**
```ts
await fetch("https://example.com", {
 tls: {
  key: Bun.file("/path/to/key.pem"),
  cert: Bun.file("/path/to/cert.pem"),
 },
…
```
- Custom TLS Validation · Disable TLS validation · Request options
```ts
const response = await fetch("http://example.com", {
 decompress: true,
 keepalive: false,
 verbose: true, // or "curl" for more detailed output
});
```
- Protocol support · S3 URLs - `s3://` · File URLs - `file://` · Data URLs - `data:` · Blob URLs - `blob:` · Error handling
- Using a request body with GET/HEAD methods throws an error (which is expected for the fetch API)
- Using the `proxy` and `unix` options together throws an error
- Connection failures reject with a `TypeError` whose `code` is the socket error (`ECONNREFUSED`, `ECONNRESET`, `ETIMEDO
- TLS certificate validation failures when `rejectUnauthorized` is true (or undefined)
- S3 operations may throw specific errors related to authentication or permissions
- **Content-Type handling**
- For `Blob` objects, uses the blob's `type`
- For `FormData`, sets appropriate multipart boundary
### Debugging
`const response = await fetch("http://example.com", { verbose: true, });`
`verbose: boolean` is a Bun-specific extension, not part of the Web standard `fetch` API.
### Performance
Before an HTTP request can be sent, Bun has to resolve DNS, connect the TCP socket, and sometimes complete a TLS handsh…
- **DNS prefetching**
Use `dns.prefetch` when you know you'll connect to a host soon and want to avoid the initial DNS lookup.
`import { dns } from "bun"; dns.prefetch("bun.com");`
- DNS caching · Preconnect to a host
`fetch.preconnect` starts the DNS lookup, TCP socket connection, and TLS handshake for a host before you're ready to se…
`import { fetch } from "bun"; fetch.preconnect("https://bun.com");`
- Preconnect at startup · Connection pooling & HTTP keep-alive
Bun automatically reuses connections to the same host.
- Fetch sessions · Connecting to a specific address · Simultaneous connection limit · Response buffering
- `response.text(): Promise`
- `response.json(): Promise`
- `response.formData(): Promise`
- `response.bytes(): Promise`
- `response.arrayBuffer(): Promise`
- `response.blob(): Promise`
`import { write } from "bun"; await write("output.txt", response);`
- **Implementation details**
- Connection pooling is enabled by default. You can disable it per-request with `keepalive: false` or the `"Connection: 
- Bun optimizes large file uploads using the operating system's `sendfile` syscall under specific conditions:
- The file must be larger than 32KB
- The request must not be using a proxy or the `compress` option
- On macOS, only regular files (not pipes, sockets, or devices) can use `sendfile`
- When these conditions aren't met, or when using S3/streaming uploads, Bun falls back to reading the file into memory
Many of these features are Bun-specific extensions to the standard fetch API.

## TCP — `docs/runtime/networking/tcp.mdx`
> Use Bun's native TCP API to implement performance-sensitive systems like database clients, game servers, or anything that needs to communicate over TCP (instead of HTTP)
Bun's TCP API is low-level, intended for library authors and advanced use cases.
### Start a server (`Bun.listen()`)
```ts
Bun.listen({
 hostname: "localhost",
 port: 8080,
 socket: {
  data(socket, data) {}, // message received from client
…
```
In Bun, you declare one set of handlers per server instead of assigning callbacks to each socket, as with Node.js `Even…
### Create a connection (`Bun.connect()`)
Use `Bun.connect` to connect to a TCP server.
```ts
const socket = await Bun.connect({
 hostname: "localhost",
 port: 8080,
 socket: {
  data(socket, data) {},
…
```
### Hot reloading
You can hot reload both TCP servers and sockets with new handlers.
```ts
const server = Bun.listen({});
server.reload({
 socket: {
  data() {
  },
…
```
### Buffering
TCP sockets in Bun do not buffer data, so performance-sensitive code should buffer writes itself.
```ts
socket.write("h");
socket.write("e");
socket.write("l");
socket.write("l");
socket.write("o");
```

## UDP — `docs/runtime/networking/udp.mdx`
> Use Bun's UDP API to implement services with advanced real-time requirements, such as voice chat.
### Bind a UDP socket (`Bun.udpSocket()`)
`const socket = await Bun.udpSocket({}); console.log(socket.port); // assigned by the operating system`
- **Send a datagram**
Specify the data to send, the destination port, and the destination address.
`socket.send("Hello, world!", 41234, "127.0.0.1");`
- **Receive datagrams**
```ts
const server = await Bun.udpSocket({
 socket: {
  data(socket, buf, port, addr) {
   console.log(`message from ${addr}:${port}:`);
   console.log(buf.toString());
…
```
- **Connections**
UDP has no concept of a connection, but many UDP exchanges (especially as a client) involve only one peer.
```ts
const server = await Bun.udpSocket({
 socket: {
  data(socket, buf, port, addr) {
   console.log(`message from ${addr}:${port}:`);
   console.log(buf.toString());
…
```
- **Send many packets at once using `sendMany()`**
To send a large volume of packets without the overhead of a system call for each, batch them with `sendMany()`.
`const socket = await Bun.udpSocket({}); socket.sendMany(["Hello", 41234, "127.0.0.1", "foo", 53, "1.1.1.1"]);`
- **Handle backpressure**
A packet you send may not fit into the operating system's packet buffer.
- `send` returns `false`
- `sendMany` returns a number smaller than the number of packets you specified
```ts
const socket = await Bun.udpSocket({
 socket: {
  drain(socket) {
  },
 },
…
```
- **Socket options**: `const socket = await Bun.udpSocket({}); socket.setBroadcast(true); socket.setTTL(64);`
- **Multicast**
Bun supports multicast operations for UDP sockets.
```ts
const socket = await Bun.udpSocket({});
socket.addMembership("224.0.0.1");
socket.addMembership("224.0.0.1", "192.168.1.100");
socket.dropMembership("224.0.0.1");
```

## Cookies — `docs/runtime/cookies.mdx`
> Use Bun's native APIs for working with HTTP cookies
### CookieMap class
`Bun.CookieMap` is a Map-like collection of cookies.
```ts
const cookies = new Bun.CookieMap();
const cookies1 = new Bun.CookieMap("name=value; foo=bar");
const cookies2 = new Bun.CookieMap({
 session: "abc123",
 theme: "dark",
…
```
- **In HTTP servers**
In Bun's HTTP server, the `cookies` property on the request object (in `routes`) is an instance of `CookieMap`:
```ts
const server = Bun.serve({
 routes: {
  "/": req => {
   const cookies = req.cookies;
   const sessionCookie = cookies.get("session");
…
```
- Methods · `get(name: string): string | null` · `has(name: string): boolean` · `set(name: string, value: string, options?: CookieInit): void` · `set(options: CookieInit): void` · `set(cookie: Cookie): void` · `delete(name: string): void` · `delete(options: CookieStoreDeleteOptions): void` · `delete(name: string, options: Omit<CookieStoreDeleteOptions, "name">): void` · `toJSON(): Record<string, string>` · `toSetCookieHeaders(): string[]` · Iteration
```ts
for (const [name, value] of cookies) {
 console.log(`${name}: ${value}`);
}
for (const [name, value] of cookies.entries()) {
 console.log(`${name}: ${value}`);
…
```
- Properties · `size: number`
### Cookie class
`Bun.Cookie` represents an HTTP cookie with its name, value, and attributes.
```ts
import { Cookie } from "bun";
const cookie = new Bun.Cookie("name", "value");
const secureSessionCookie = new Bun.Cookie("session", "abc123", {
 domain: "example.com",
 path: "/admin",
…
```
- **Constructors**
```ts
new Bun.Cookie(name: string, value: string);
new Bun.Cookie(name: string, value: string, options: CookieInit);
new Bun.Cookie(cookieString: string);
new Bun.Cookie(options: CookieInit);
```
- **Properties**
```ts
cookie.name; // string - Cookie name
cookie.value; // string - Cookie value
cookie.domain; // string | null - Domain scope (null if not specified)
cookie.path; // string - URL path scope (defaults to "/")
cookie.expires; // Date | undefined - Expiration date
…
```
- Methods · `isExpired(): boolean` · `serialize(): string` · `toString(): string` · `toJSON(): CookieInit` · Static methods · `Cookie.parse(cookieString: string): Cookie` · `Cookie.from(name: string, value: string, options?: CookieInit): Cookie`
### Types
```ts
interface CookieInit {
 name?: string;
 value?: string;
 domain?: string;
 path?: string;
…
```
