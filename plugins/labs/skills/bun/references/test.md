# bun test

Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## Code coverage — `docs/test/code-coverage.mdx`

> Use Bun's built-in code coverage reporting to track test coverage and find untested code
> Bun's test runner has built-in code coverage reporting.

### Enabling Coverage

`bun:test` can report which lines of code your tests cover.

```bash
bun test --coverage
-------------|---------|---------|-------------------
File         | % Funcs | % Lines | Uncovered Line #s
-------------|---------|---------|-------------------
All files    |   38.89 |   42.11 |
…
```

- **Enable by Default**

### Coverage Thresholds

Set a coverage threshold in `bunfig.toml`.

- Simple Threshold · Detailed Thresholds

### Coverage Reporters

By default, Bun prints coverage reports to the console.
`[test] coverageReporter = ["text", "lcov"]  # default ["text"] coverageDir = "path/to/somewhere"    # default "coverage"`

- Available Reporters · LCOV Coverage Reporter · Using LCOV with GitHub Actions

### Excluding Files from Coverage

- Skip Test Files · Ignore Specific Paths and Patterns · Common Use Cases

### Sourcemaps

Bun transpiles all files by default, generating an internal source map that maps lines of your original source code ont…
`[test] coverageIgnoreSourcemaps = true  # default false`

### Coverage Defaults

- **Exclude** `node_modules` directories
- **Exclude** files loaded with non-JS/TS loaders (for example `.css`, `.txt`) unless you specify a custom JS loader
- **Exclude** test files themselves (include them with `coverageSkipTestFiles = false`)
- Can exclude additional files with `coveragePathIgnorePatterns`

### Advanced Configuration

- Custom Coverage Directory · Multiple Reporters · Coverage with Specific Test Patterns

### CI/CD Integration

- GitHub Actions Example · GitLab CI Example

### Interpreting Coverage Reports

- Text Output Explanation · What to Aim For

### Best Practices

- Focus on Quality, Not Just Quantity · Test Edge Cases · Use Coverage to Find Missing Tests · Combine with Other Quality Metrics

### Troubleshooting

- Coverage Not Showing for Some Files · False Coverage Reports · Performance Issues with Large Codebases

## Test configuration — `docs/test/configuration.mdx`

> Configure bun test behavior with bunfig.toml and command-line options
> Configure `bun test` with `bunfig.toml` and command-line options.

### Configuration File

`[test]`

### Test Discovery

- root · Examples · Preload Scripts · Common Preload Use Cases · Environment · Globals · React Compiler · Path Ignore Patterns · Common Use Cases

### Reporters

- JUnit Reporter · Multiple Reporters

### Memory Usage

- **smol Mode**

### Test execution

- concurrentTestGlob · randomize · seed · retry · rerunEach · clearMocks, mockReset, restoreMocks, unstubEnvs, unstubGlobals

### Coverage Options

- Basic Coverage Settings · Skip Test Files from Coverage · Coverage Thresholds · Threshold Examples · Coverage Path Ignore Patterns · Common Ignore Patterns · Sourcemap Handling

### Install Settings Inheritance

`bun test` inherits network and installation configuration (such as `registry`, `cafile`, `prefer`, and `exact`) from t…

```toml
[install]
# These settings are inherited by bun test
registry = "https://npm.company.com/"
exact = true
prefer = "offline"
…
```

### Environment Variables

Set environment variables for tests with `.env` files, which Bun loads from your project root automatically.
`NODE_ENV=test DATABASE_URL=postgresql://localhost:5432/test_db LOG_LEVEL=error`

### Complete Configuration Example

```toml
[install]
# Install settings inherited by tests
registry = "https://registry.npmjs.org/"
exact = true
[test]
…
```

### CLI Override Behavior

`[test] coverage = false`

## Dates and times — `docs/test/dates-times.mdx`

> Learn how to manipulate time and dates in your Bun tests using setSystemTime and Jest compatibility functions
> `bun:test` lets you change what time it is in your tests.

- `Date.now`
- `new Date()`
- `new Intl.DateTimeFormat().format()`

### setSystemTime

```ts
import { setSystemTime, beforeAll, test, expect } from "bun:test";
beforeAll(() => {
 setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
});
test("it is 2020", () => {
…
```

`setSystemTime` takes a `Date`, a timestamp in milliseconds, or a date string that `new Date()` can parse.

### Reset the system time

```ts
import { setSystemTime, expect, test } from "bun:test";
test("it was 2020, for a moment.", () => {
 setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
 expect(new Date().getFullYear()).toBe(2020);
 setSystemTime();
…
```

### Get mocked time with jest.now()

When the time is mocked (with `setSystemTime` or `useFakeTimers`), `jest.now()` returns the current mocked timestamp:

```ts
import { test, expect, jest } from "bun:test";
test("get the current mocked time", () => {
 jest.useFakeTimers();
 jest.setSystemTime(new Date("2020-01-01T00:00:00.000Z"));
 expect(Date.now()).toBe(1577836800000); // Jan 1, 2020 timestamp
…
```

### Fake timers

`useFakeTimers()` replaces `setTimeout`, `setInterval`, `clearTimeout` and `clearInterval` on `globalThis` with version…

```ts
import { test, expect, jest } from "bun:test";
test("fires after a minute", () => {
 jest.useFakeTimers();
 const callback = jest.fn();
 setTimeout(callback, 60_000);
…
```

| Function | What it does …|
| - | -…|
| `advanceTimersByTime(ms)` | Advances the clock by `ms` and runs the timers that come …|
| `advanceTimersToNextTimer(steps)` | Advances the clock to the next timer, `steps` times (defa…|
| `advanceTimersToNextFrame()` | Advances the clock to the next multiple of 16 ms …|
| `runOnlyPendingTimers()` | Advances the clock to the last timer that's pending now …|
| `runAllTimers()` | Runs timers until none are left …|
| `runAllTicks()` | Runs faked `process.nextTick` and `queueMicrotask` callba…|
| `getTimerCount()` | Returns the number of pending fake timers …|
| `clearAllTimers()` | Removes all pending fake timers …|

- Timers scheduled after an `await` · Choose what to fake · Wait for real time while fake timers are on · Advance the clock automatically

### Set the time zone

By default, `bun test` runs in UTC (`Etc/UTC`).
`TZ=America/Los_Angeles bun test`

## Finding tests — `docs/test/discovery.mdx`

> Learn how Bun's test runner discovers and filters test files in your project
> `bun test` decides which files to run as tests by matching their paths against a set of patterns.

### Default Discovery Logic

By default, `bun test` recursively searches the project directory for files that match these patterns:

- `*.test.{js|jsx|ts|tsx|mjs|cjs|mts|cts}` - Files ending with `.test.js`, `.test.jsx`, `.test.ts`, `.test.tsx`, `.test.
- `*_test.{js|jsx|ts|tsx|mjs|cjs|mts|cts}` - Files ending with `_test.js`, `_test.jsx`, `_test.ts`, `_test.tsx`, `_test.
- `*.spec.{js|jsx|ts|tsx|mjs|cjs|mts|cts}` - Files ending with `.spec.js`, `.spec.jsx`, `.spec.ts`, `.spec.tsx`, `.spec.
- `*_spec.{js|jsx|ts|tsx|mjs|cjs|mts|cts}` - Files ending with `_spec.js`, `_spec.jsx`, `_spec.ts`, `_spec.tsx`, `_spec.

### Exclusions

- `node_modules` directories
- Hidden directories (those starting with a period `.`)
- Files that don't have JavaScript-like extensions (based on available loaders)

### Customizing Test Discovery

- Position Arguments as Filters · Specifying Exact File Paths · Filter by Test Name · Changing the Root Directory

### Execution Order

- Test files run sequentially, or across worker processes with `--parallel`
- Within each file, tests run sequentially in definition order

## DOM testing — `docs/test/dom.mdx`

> Learn how to test DOM elements and components using Bun with happy-dom and React Testing Library
> Bun's test runner plays well with existing component and DOM testing libraries, including React Testing Library and hap…

### Test environments

`bun test` can set up happy-dom or jsdom for you.
`bun add -d happy-dom`

- `@vitest-environment` can be anywhere in the file.
- `@jest-environment` means the same thing, but it has to be in a `/** */` comment at the very top of the file. It's ign
- Options · Windows and test files

### Registering happy-dom in a preload

Instead of setting `environment`, you can register the globals yourself in a preload script.
`bun add -d @happy-dom/global-registrator`

- **TypeScript Support**

### React Testing Library

Bun works with React Testing Library for testing React components.
`bun add -d @testing-library/react @testing-library/jest-dom`

### Advanced DOM Testing

- Custom Elements · Event Testing

### Configuration Tips

- **Global Setup**

### Troubleshooting

- Common Issues · Performance Considerations

## Test runner — `docs/test/index.mdx`

> Bun's fast, built-in, Jest-compatible test runner with TypeScript support, lifecycle hooks, mocking, and watch mode
> Bun ships with a fast, built-in, Jest-compatible test runner.

- TypeScript and JSX
- Lifecycle hooks
- Snapshot testing
- UI & DOM testing
- Watch mode with `--watch`
- Script pre-loading with `--preload`

### Run tests

`bun test`
You write tests in JavaScript or TypeScript with a Jest-like API.

- `*.test.{js|jsx|ts|tsx|mjs|cjs|mts|cts}`
- `*_test.{js|jsx|ts|tsx|mjs|cjs|mts|cts}`
- `*.spec.{js|jsx|ts|tsx|mjs|cjs|mts|cts}`
- `*_spec.{js|jsx|ts|tsx|mjs|cjs|mts|cts}`

### CI/CD integration

`bun test` supports a variety of CI/CD integrations.

- GitHub Actions · How to install `bun` in a GitHub Actions workflow · JUnit XML reports (GitLab, etc.)

### Timeouts

Use the `--timeout` flag to specify a _per-test_ timeout in milliseconds.
`bun test --timeout 20`

### Concurrent test execution

To run test **files** across CPU cores, see `--parallel`.

- `--concurrent` flag · `--max-concurrency` flag · `test.concurrent` · `test.serial`

### Retry failed tests

Use the `--retry` flag to automatically retry failed tests up to a given number of times.
`bun test --retry 3`

### Rerun tests

Use the `--rerun-each` flag to run each test multiple times.
`bun test --rerun-each 100`

### Randomize test execution order

Use the `--randomize` flag to run tests in a random order.
`bun test --randomize`

- Reproducible random order with `--seed` · Shuffle one block with `describe.shuffle`

### Bail out with `--bail`

Use the `--bail` flag to abort the test run after a given number of test failures.
`bun test --bail bun test --bail=10`

### Watch mode

Like `bun run`, `bun test` accepts the `--watch` flag to watch for changes and re-run tests.
`bun test --watch`

### Type check your tests

`bun test` runs TypeScript tests without checking their types.
`bun test --check`

### Lifecycle hooks

| Hook                                                                                       | Description                 |
| ------------------------------------------------------------------------------------------ | --------------------------- |
| `beforeAll`                                                                                | Runs once before all tests. |
| `beforeEach`                                                                               | Runs before each test.      |
| `afterEach`                                                                                | Runs after each test.       |
| `afterAll`                                                                                 | Runs once after all tests.  |
| `aroundEach`                                                                               | Wraps each test.            |
| `aroundAll`                                                                                | Wraps all tests.            |
| Define hooks inside test files, or in a separate file preloaded with the `--preload` flag. |
| `bun test --preload ./setup.ts`                                                            |

### Mocks

Create mock functions with the `mock` function.

```ts
import { test, expect, mock } from "bun:test";
const random = mock(() => Math.random());
test("random", () => {
 const val = random();
 expect(val).toBeGreaterThan(0);
…
```

### Snapshot testing

`bun test` supports snapshot testing.

```ts
import { test, expect } from "bun:test";
test("snapshot", () => {
  expect({ a: 1 }).toMatchSnapshot();
});
```

### UI & DOM testing

- HappyDOM
- DOM Testing Library
- React Testing Library
  See DOM testing.

### Large codebases

**1. Use every core: `--parallel`.** One worker per core, files handed out one at a time.

```yaml
jobs:
 test:
  strategy:
   matrix:
    shard: [1, 2, 3, 4]
…
```

### Performance

Bun's test runner is fast.

### AI Agent Integration

When you use Bun's test runner with an AI coding assistant, you can enable quieter output that keeps failure details bu…

- Environment Variables · Behavior

## Lifecycle hooks — `docs/test/lifecycle.mdx`

> Learn how to use beforeAll, beforeEach, afterEach, afterAll, aroundEach, and aroundAll lifecycle hooks in Bun tests
> The test runner supports the following lifecycle hooks.
> | Hook | Description | | - | - |
> | `beforeAll` | Runs once before all tests. |
> | `beforeEach` | Runs before each test. |
> | `afterEach` | Runs after each test. |
> | `afterAll` | Runs once after all tests. |
> | `aroundEach` | Wraps each test in a function. |
> | `aroundAll` | Wraps all tests in a function. |
> | `onTestFinished` | Runs after a single test finishes (after all `afterEach`). |

### Per-Test Setup and Teardown

Perform per-test setup and teardown logic with `beforeEach` and `afterEach`.

```ts
import { beforeEach, afterEach, test } from "bun:test";
beforeEach(() => {
 console.log("running test.");
});
afterEach(() => {
…
```

### Per-Scope Setup and Teardown

Perform per-scope setup and teardown logic with `beforeAll` and `afterAll`.

- Scoped to a Describe Block · Scoped to a Test File · `onTestFinished`

### Wrapping Tests

```ts
import { aroundEach, test } from "bun:test";
import { db } from "./db";
aroundEach(async runTest => {
 await db.transaction(runTest);
});
…
```

`runTest()` runs the `beforeEach` hooks, the test, the `afterEach` hooks and the `onTestFinished` callbacks.

- **Order.** Hooks nest. The first hook you register is the outermost one. The hooks of an outer `describe` block go aro
- **Arguments.** `aroundEach` calls the hook with `(runTest, context, suite)`. `context` is the test context. `aroundAll
- **Retries.** `aroundEach` runs again for each retry and each repeat. It doesn't run for a skipped or todo test. `aroun
- **Failures.** The test fails if the hook throws, or if it finishes without calling `runTest()`. If the hook fails befo
- **Timeout.** The second argument is a timeout in milliseconds: `aroundEach(fn, 1000)`. It applies to the time before `
- **Async context**

### Global Setup and Teardown

To scope the hooks to an entire multi-file test run, define the hooks in a separate file.

```ts
import { beforeAll, afterAll } from "bun:test";
beforeAll(() => {
 console.log("Global test setup");
});
afterAll(() => {
…
```

### Practical Examples

- Database Setup · API Server Setup · Mock Setup

### Async Lifecycle Hooks

All lifecycle hooks support async functions.

```ts
import { beforeAll, afterAll, test, expect } from "bun:test";
beforeAll(async () => {
 await new Promise(resolve => setTimeout(resolve, 100));
 console.log("Async setup complete");
});
…
```

### Nested Hooks

```ts
import { describe, beforeAll, beforeEach, afterEach, afterAll, test } from "bun:test";
beforeAll(() => console.log("File beforeAll"));
afterAll(() => console.log("File afterAll"));
describe("outer describe", () => {
 beforeAll(() => console.log("Outer beforeAll"));
…
```

### Error Handling

```ts
import { beforeAll, test } from "bun:test";
beforeAll(() => {
 throw new Error("Setup failed");
});
test("this test will be skipped", () => {
…
```

### Best Practices

- Keep Hooks Simple · Use Appropriate Scope · Clean Up Resources

## Mocks — `docs/test/mocks.mdx`

> Learn how to create and use mock functions, spies, and module mocks in Bun tests
> Mocking replaces a dependency with a controlled implementation.

### Basic Function Mocks

Create mocks with the `mock` function.

```ts
import { test, expect, mock } from "bun:test";
const random = mock(() => Math.random());
test("random", () => {
 const val = random();
 expect(val).toBeGreaterThan(0);
…
```

- **Jest Compatibility**

### Mock Function Properties

`mock()` returns a new function decorated with additional properties.

```ts
import { mock } from "bun:test";
const random = mock((multiplier: number) => multiplier * Math.random());
random(2);
random(10);
random.mock.calls;
…
```

- Available Properties and Methods · Practical Examples · Basic Mock Usage · Dynamic Mock Implementations · Async Mocks

### Spies with spyOn()

Use `spyOn()` to track calls to a function without replacing it with a mock.

```ts
import { test, expect, spyOn } from "bun:test";
const ringo = {
 name: "Ringo",
 sayHi() {
  console.log(`Hello I'm ${this.name}`);
…
```

- Advanced Spy Usage · Getters and Setters · Classes

### Mock an Object with vi.mockObject()

`vi.mockObject(value)` returns a deep copy of `value` with every function and class replaced by a mock that returns `un…

```ts
import { test, expect, vi } from "bun:test";
test("mock an object", () => {
 const api = vi.mockObject({
  version: 2,
  fetchUser: (id: string) => ({ id }),
…
```

### Module Mocks with mock.module()

```ts
import { test, expect, mock } from "bun:test";
mock.module("./module", () => {
 return {
  foo: "bar",
 };
…
```

Like the rest of Bun, module mocks support both `import` and `require`.

- Overriding Already Imported Modules · Keeping Part of the Original Module · Getters and Missing Exports · Mocking a Package · Mocking Without a Factory · Removing a Mock · Module Mocks Are Removed After Each Test File · Hoisting & Preloading · Module Mock Best Practices · When to Use Preload · Practical Module Mock Examples · Mocking External Dependencies

### Global Mock Functions

- Clear All Mocks · Reset All Mocks · Restore All Mocks · Cleanup After Each Test File

### Vitest Compatibility

Bun provides the `vi` object for tests written for Vitest.

- `mockReset()` goes back to the original implementation.
- `vi.restoreAllMocks()` keeps the recorded calls of the spies it restores.
- `fn.mock` is still the same object after `mockClear()`.
- `getMockImplementation()` returns what the next call runs, so a `mockReturnValueOnce()` that is still waiting comes fi

```ts
import { test, expect, vi } from "bun:test";
test("vitest compatibility", () => {
 const mockFn = vi.fn(() => 42);
 mockFn();
 expect(mockFn).toHaveBeenCalled();
…
```

- Stubs and Waiting · Differences from Vitest

### Implementation Details

- Cache Interaction · Lazy Evaluation · Path Resolution · Import Timing Effects · Live Bindings

### Advanced Patterns

- Factory Functions · Conditional Mocking · Mock Cleanup Patterns

### Best Practices

- Keep Mocks Simple · Use Type-Safe Mocks · Test Mock Behavior

### Notes

- **ESM vs CommonJS**

## Parallel & isolated test runs — `docs/test/parallel.mdx`

> Run test files across CPU cores with --parallel, isolate files from each other with --isolate, run tests within a file concurrently, and split suites across CI machines with --shard and --timings
> | Flag | Unit of parallelism | What it does …|
> | - | - | -…|
> | `--parallel[=N]` | test **files**, in processes | Runs files across `N` worker processes (default: number o…|
> | `--concurrent` / `test.concurrent` | **tests** within one file | Lets `async` tests in the same file overlap while one is …|
> | `--shard=i/n` | test files, across **machines** | Runs the `i`-th of `n` deterministic slices of the suite.…|
> They compose: a CI job can run `bun test --shard=2/4 --parallel`, and files in that shard can still contain `test.concu…

### `--parallel`

`bun test --parallel        # one worker per CPU core bun test --parallel=4      # exactly 4 workers`
The main `bun test` process becomes a coordinator.

- How files are distributed · Every file is isolated (unless you opt out) · Worker environment · When `--parallel` helps, and when it doesn't

### `--isolate`

`bun test --isolate`
Runs each test file in a fresh JavaScript global object inside the same process.

- creates a new `globalThis` (so properties a file stuck on `globalThis`, patched built-ins, and module-level state are
- clears the ESM and CommonJS module registries (every file re-evaluates its imports),
- closes servers, sockets, file watchers and subprocesses the file left open, cancels its timers, and restores fake time
- re-runs `--preload` scripts in the new global.
- **`--isolate=modules`**

### Concurrent tests within a file

`--parallel` spreads _files_ across cores.

```ts
import { test, expect } from "bun:test";
test.concurrent("GET /users", async () => {
 const res = await fetch(`${baseUrl}/users`);
 expect(res.status).toBe(200);
});
…
```

- `test.concurrent(...)` / `describe.concurrent(...)` mark individual tests or whole groups.
- `--concurrent` treats every test as concurrent; `test.serial` opts back out.
- `--max-concurrency=N` caps how many run at once (default 20).
- `concurrentTestGlob` in `bunfig.toml` turns it on for matching files only.

### Splitting a suite across CI machines with `--shard`

`bun test --shard=1/3   # machine 1 bun test --shard=2/3   # machine 2 bun test --shard=3/3   # machine 3`
Every machine sorts the discovered test files by path and takes a deterministic slice, so together the shards cover eac…

- Balancing with `--timings` · One timings file per shard

### How it compares

2 000 TypeScript test files × 8 small tests each, all importing a small app built on `zod`, `date-fns` and `lodash`, wi…

| Mode                             | Bun                                           | Vitest 4.1                                            | Jest 30 (`@swc/jest`)                                  |
| -------------------------------- | --------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| all cores, one global per worker | `bun test --parallel --no-isolate` **0.75 s** | `vitest run --no-isolate` 3.7 s                       | —                                                      |
| all cores, fresh global per file | `bun test --parallel` **6.8 s**               | `vitest run` 133 s                                    | `jest` 19.1 s                                          |
| one thread, one global           | `bun test` **2.4 s**                          | `vitest run --no-isolate --no-file-parallelism` 8.5 s | — (`jest --runInBand`, 80 s, still isolates each file) |

## Test Reporters — `docs/test/reporters.mdx`

`bun test` supports different output formats through reporters, both built-in and custom.

### Built-in Reporters

- Default Console Reporter · Dots Reporter · JUnit XML Reporter · Using the JUnit Reporter · Configuring via bunfig.toml · Describe Blocks in JUnit Reports · Retried tests · Environment Variables in JUnit Reports · Current Limitations · GitHub Actions reporter

### Custom Reporters

You can implement custom test reporters with Bun's testing-specific extensions to the WebKit Inspector Protocol, which …

- Inspector Protocol for Testing · Key Events

## Runtime behavior — `docs/test/runtime-behavior.mdx`

> Learn about Bun test's runtime integration, environment variables, timeouts, and error handling
> `bun test` is deeply integrated with Bun's runtime.

### Environment Variables

- NODE_ENV · TZ (Timezone) · `import.meta.env`

### Test Timeouts

Each test has a default timeout of 5000ms (5 seconds).

- Global Timeout · Per-Test Timeout · Infinite Timeout

### Timers

Like Node.js, Bun makes a `setTimeout()` delay under 1 ms wait for 1 ms.

### Error Handling

- Unhandled Errors · Promise Rejections · Unsettled Top-Level Await · Custom Error Handling

### CLI Flags Integration

- Memory Usage · Debugging · Module Loading · Installation-related Flags

### Watch and Hot Reloading

- Watch Mode · Hot Reloading

### Global Variables

```ts
test("global test function", () => {
 expect(true).toBe(true);
});
describe("global describe", () => {
 beforeAll(() => {
…
```

If a file imports only some of them, the rest are still available as globals.

### Process Integration

- Exit Codes · Signal Handling · Environment Detection

### Performance Considerations

- Single Process · Memory Management · Test Isolation

## Snapshots — `docs/test/snapshots.mdx`

> Learn how to use snapshot testing in Bun to save and compare output between test runs
> Snapshot testing saves the output of a value and compares it against future test runs.

### Basic Snapshots

```ts
import { test, expect } from "bun:test";
test("snap", () => {
  expect("foo").toMatchSnapshot();
});
```

The first time this test runs, Bun serializes the argument to `expect` and writes it to a snapshot file in a `__snapsho…

- **Snapshot Files**

### Updating Snapshots

`bun test --update-snapshots`
Do this when you've intentionally changed the output.

### Inline Snapshots

For smaller values, use `.toMatchInlineSnapshot()`.

```ts
import { test, expect } from "bun:test";
test("inline snapshot", () => {
  expect({ hello: "world" }).toMatchInlineSnapshot();
});
```

- **Using Inline Snapshots**

### Error Snapshots

You can also snapshot error messages with `.toThrowErrorMatchingSnapshot()` and `.toThrowErrorMatchingInlineSnapshot()`:

```ts
import { test, expect } from "bun:test";
test("error snapshot", () => {
 expect(() => {
  throw new Error("Something went wrong");
 }).toThrowErrorMatchingSnapshot();
…
```

### File Snapshots

`.toMatchFileSnapshot()` compares a value with a snapshot stored in its own file.

```ts
import { test, expect } from "bun:test";
test("renders the page", async () => {
  await expect(render(page)).toMatchFileSnapshot("./snapshots/page.html");
});
```

- A string is compared with the file's contents as is.
- Any other value is printed first. Bun always prints it the way Vitest does (`pretty-format`), even when `test` is impo
- If the file doesn't exist, Bun creates it, except in CI.
- `--update-snapshots` rewrites a file that doesn't match.

### Advanced Snapshot Usage

- Complex Objects · Array Snapshots · Function Output Snapshots

### React Component Snapshots

```tsx
import { test, expect } from "bun:test";
import { render } from "@testing-library/react";
function Button({ children, variant = "primary" }) {
 return <button className={`btn btn-${variant}`}>{children}</button>;
}
…
```

### Property Matchers

```ts
import { test, expect } from "bun:test";
test("snapshot with dynamic values", () => {
 const user = {
  id: Math.random(), // This changes every run
  name: "John",
…
```

### Custom Serializers

Use `expect.addSnapshotSerializer()` to change how snapshot matchers print certain values.

```ts
import { test, expect } from "bun:test";
expect.addSnapshotSerializer({
 test: value => value instanceof Money,
 serialize: value => `${value.amount} ${value.currency}`,
});
…
```

### Snapshots from Jest and Vitest

Bun reads and writes each snapshot file in the format of the runner that created it.

| First line              | Keys              | Values          | `toThrowErrorMatchingSnapshot()` |
| ----------------------- | ----------------- | --------------- | -------------------------------- |
| `// Bun Snapshot v1`    | `outer inner 1`   | Bun's format    | the error message                |
| `// Jest Snapshot v1`   | `outer inner 1`   | `pretty-format` | the error message                |
| `// Vitest Snapshot v1` | `outer > inner 1` | `pretty-format` | the error                        |

### Best Practices

- Keep Snapshots Small · Use Descriptive Test Names · Group Related Snapshots · Handle Dynamic Data

### Managing Snapshots

- Reviewing Snapshot Changes · Organizing Large Snapshot Files

### Troubleshooting

- Snapshot Failures · Platform Differences

## Writing tests — `docs/test/writing-tests.mdx`

> Write tests with Bun's Jest-compatible API, including async tests, timeouts, and test modifiers
> Define tests with a Jest-like API imported from the built-in `bun:test` module.

### Basic Usage

```ts
import { expect, test } from "bun:test";
test("2 + 2", () => {
  expect(2 + 2).toBe(4);
});
```

- Grouping Tests · Async Tests

### Timeouts

Optionally specify a per-test timeout in milliseconds by passing a number as the third argument to `test`.

```ts
import { expect, test } from "bun:test";
test("wat", async () => {
  const data = await slowOperation();
  expect(data).toBe(42);
}, 500); // test must run in <500ms
```

### Retries and Repeats

- test.retry · test.repeats · 🧟 Zombie Process Killer

### Test Modifiers

- test.skip · test.todo · test.only · test.if · test.skipIf · test.todoIf · test.failing · Combining modifiers

### Conditional Tests for Describe Blocks

The conditional modifiers `.if()`, `.skipIf()`, and `.todoIf()` also work on `describe` blocks, affecting all tests in …

```ts
const isMacOS = process.platform === "darwin";
describe.if(isMacOS)("macOS-specific features", () => {
 test("feature A", () => {
 });
 test("feature B", () => {
…
```

### Parametrized Tests

- `test.each` and `describe.each` · Argument Passing · `test.for` and `describe.for` · Format Specifiers · Examples

### Fixtures

`test.extend()` returns a new `test` function with fixtures.

```ts
import { test as base, expect } from "bun:test";
const test = base.extend<{ server: Bun.Server<undefined>; url: string }>({
 server: async ({}, use) => {
  const server = Bun.serve({ port: 0, fetch: () => new Response("ok") }); // setup
  await use(server); // the test runs here
…
```

- By default, a fixture is only set up for tests that destructure it, so the first parameter must be an object destructu
- `test.beforeEach()` and `test.afterEach()` on the extended `test` receive fixtures, like a test does. `beforeEach` and
- An `aroundEach` hook receives fixtures in its second parameter: `aroundEach(async (runTest, { server }) => {})`.
- Fixtures are torn down in reverse order, after the `afterEach` hooks. A fixture that an `aroundEach` hook destructures
- A fixture that isn't a function is passed as is.
- You can call `test.extend()` on an extended `test`. A fixture that replaces one with the same name can destructure the
  | Option | Description …|
  | - | -…|
  | `[fixture, { auto: true }]` | Sets up the fixture for every test, even tests that don't…|
  | `[fixture, { scope: "file" }]` | Sets up the fixture once, for the first test that needs i…|
  | `test.override({ name: fixture })` | Replaces fixtures in the `describe` block it's called in …|
  | `test.beforeAll(({ name }) => {})` | `beforeAll`, `afterAll` and `aroundAll` hooks that receiv…|
- **Test Context**

### Importing from `vitest`

In `bun test`, `"vitest"` is a built-in module, like `"bun:test"` and `"@jest/globals"`.
| | `"bun:test"`, `"@jest/globals"` | `"vitest"` …|
| - | - | -…|
| Test or hook callback's parameter | a `done` callback that Bun waits for | the test context |
| `test.each` callback's extra parameter | a `done` callback | `undefined` …|
| Values in a `test.each` title | printed in full: `{ a: "x" }` | printed as in Vitest: `{ a: 'x' }`, `[ 0, 1, …(118) ]` …|
| `beforeAll` and `afterAll` callback parameters | `(done)` | `({}, suite)` …|
| `afterEach` and `afterAll` hooks in the same scope | run in registration order | run in reverse registration order …|
| Function returned by `beforeEach` or `beforeAll` | ignored | runs after the matching `afterEach` / `afterAll` hooks …|
| `test(name, { skip, only, todo, fails, concurrent }, fn)` | these options are ignored | these options work like the modifiers …|
| `describe(name, options, fn)` | options are ignored | options are the defaults for the tests inside …|

- **Types**

### Promises

`.resolves` and `.rejects` run the matcher on the value a promise resolves to or rejects with.

```ts
test("promises", async () => {
  await expect(Promise.resolve(42)).resolves.toBe(42);
  await expect(fetchUser("invalid-id")).rejects.toThrow("User not found");
  await expect(() => fetchUser("invalid-id")).rejects.toThrow("User not found");
});
```

- `toThrow()` on a function that returns a pending promise
- A custom matcher that returns a promise
- A matcher that compares a pending promise with `expect.resolvesTo` or `expect.rejectsTo`

### Soft Assertions

`expect.soft()` doesn't throw when a matcher fails.

```ts
test("response", async () => {
  const response = await fetch(url);
  expect.soft(response.status).toBe(200);
  expect.soft(response.headers.get("content-type")).toBe("text/html"); // checked even if the status is wrong
});
```

### Polling

`expect.poll()` calls a function, awaits its result, and runs the matcher on it.

```ts
test("the queue drains", async () => {
  await expect.poll(() => queue.length).toBe(0);
  await expect
    .poll(() => fetchStatus(), {
      interval: 10,
      timeout: 500,
      message: "status",
    })
    .toBe("ready");
});
```

| Option | Default | Description …|
| - | - | -…|
| `interval` | `50` | Milliseconds between attempts …|
| `timeout` | `1000` | Milliseconds before the promise rejects with the last fai…|
| `message` | | Custom message shown if the matcher fails, as in `expect(…|

- `interval` and `timeout` are measured in real time, even with fake timers. Each attempt also advances the fake clock b
- `expect.poll()` doesn't support `.resolves`, `.rejects`, `toThrow()`, or the snapshot matchers. Use `vi.waitFor()` for

### Assertion Counting

- expect.hasAssertions() · expect.assertions(count)

### Custom Equality

Use `expect.addEqualityTesters()` to teach `toEqual()`, `toStrictEqual()`, `toMatchObject()`, `toHaveBeenCalledWith()`,…

```ts
function areVolumesEqual(a: unknown, b: unknown) {
 if (a instanceof Volume && b instanceof Volume) return a.equals(b);
 return undefined;
}
expect.addEqualityTesters([areVolumesEqual]);
…
```

### Test State

`expect.getState()` returns information about the running test.

```ts
describe("math", () => {
 test("adds", () => {
  const { currentTestName, testPath, assertionCalls } = expect.getState();
  console.log(currentTestName); // "math adds"
 });
…
```

| Property | Description …|
| - | -…|
| `currentTestName` | The `describe` names and the test name, joined by a space…|
| `testPath` | The test file's absolute path …|
| `assertionCalls` | Number of assertions the test has made …|
| `expectedAssertionsNumber` | The count passed to `expect.assertions()`, or `null` …|
| `isExpectingAssertions` | `true` after `expect.hasAssertions()`, unless the test al…|

### Type Testing

Bun includes `expectTypeOf` for testing TypeScript types, compatible with Vitest.

- **expectTypeOf**

### Matchers

Bun implements the following matchers.

- Basic Matchers · String and Array Matchers · Object Matchers · Number Matchers · Function and Class Matchers · Promise Matchers · Mock Function Matchers · Snapshot Matchers · Utility Matchers

### Best Practices

- Use Descriptive Test Names · Group Related Tests · Use Appropriate Matchers · Test Error Conditions · Use Setup and Teardown
