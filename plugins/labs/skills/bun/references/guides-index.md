# Bun guides, project docs, lint rules index

Source: oven-sh/bun@7f964e6 docs/ (2026-11-11). One line per doc: path — title — description. Read the file under C:/src/third_party/browsers/oven-sh_bun/docs/ or https://bun.com/docs/<path-without-ext>.

## guides/

### guides/binary

- `arraybuffer-to-array` Convert an ArrayBuffer to an array of numbers
- `arraybuffer-to-blob` Convert an ArrayBuffer to a Blob
- `arraybuffer-to-buffer` Convert an ArrayBuffer to a Buffer
- `arraybuffer-to-string` Convert an ArrayBuffer to a string
- `arraybuffer-to-typedarray` Convert an ArrayBuffer to a Uint8Array
- `blob-to-arraybuffer` Convert a Blob to an ArrayBuffer
- `blob-to-dataview` Convert a Blob to a DataView
- `blob-to-stream` Convert a Blob to a ReadableStream
- `blob-to-string` Convert a Blob to a string
- `blob-to-typedarray` Convert a Blob to a Uint8Array
- `buffer-to-arraybuffer` Convert a Buffer to an ArrayBuffer
- `buffer-to-blob` Convert a Buffer to a blob
- `buffer-to-readablestream` Convert a Buffer to a ReadableStream
- `buffer-to-string` Convert a Buffer to a string
- `buffer-to-typedarray` Convert a Buffer to a Uint8Array
- `dataview-to-string` Convert a DataView to a string
- `typedarray-to-arraybuffer` Convert a Uint8Array to an ArrayBuffer
- `typedarray-to-blob` Convert a Uint8Array to a Blob
- `typedarray-to-buffer` Convert a Uint8Array to a Buffer
- `typedarray-to-dataview` Convert a Uint8Array to a DataView
- `typedarray-to-readablestream` Convert a Uint8Array to a ReadableStream
- `typedarray-to-string` Convert a Uint8Array to a string

### guides/deployment

- `aws-lambda` Deploy a Bun application on AWS Lambda
- `digital-ocean` Deploy a Bun application on DigitalOcean
- `google-cloud-run` Deploy a Bun application on Google Cloud Run
- `railway` Deploy a Bun application on Railway — Deploy a Bun application to Railway from the CLI or dashboard, with optional PostgreSQL setup and automatic SS
- `render` Deploy a Bun application on Render
- `vercel` Deploy a Bun application on Vercel

### guides/ecosystem

- `astro` Build an app with Astro and Bun
- `discordjs` Create a Discord bot
- `docker` Containerize a Bun application with Docker
- `drizzle` Use Drizzle ORM with Bun
- `elysia` Build an HTTP server using Elysia and Bun
- `express` Build an HTTP server using Express and Bun
- `gel` Use Gel with Bun
- `hono` Build an HTTP server using Hono and Bun
- `mongoose` Read and write data to MongoDB using Mongoose and Bun
- `neon-drizzle` Use Neon Postgres through Drizzle ORM
- `neon-serverless-postgres` Use Neon's Serverless Postgres with Bun
- `nextjs` Build an app with Next.js and Bun
- `nuxt` Build an app with Nuxt and Bun
- `pm2` Run Bun as a daemon with PM2
- `prisma-postgres` Use Prisma Postgres with Bun
- `prisma` Use Prisma with Bun
- `qwik` Build an app with Qwik and Bun
- `react` Build a React app with Bun
- `remix` Build an app with Remix and Bun
- `sentry` Add Sentry to a Bun app
- `solidstart` Build an app with SolidStart and Bun
- `ssr-react` Server-side render (SSR) a React component
- `sveltekit` Build an app with SvelteKit and Bun
- `systemd` Run Bun as a daemon with systemd
- `tanstack-start` Use TanStack Start with Bun
- `upstash` Bun Redis with Upstash
- `vite` Build a frontend using Vite and Bun

### guides/format

- `migrate-from-oxfmt` Migrate from oxfmt to bun fmt
- `migrate-from-prettier` Migrate from Prettier to bun fmt

### guides/html-rewriter

- `extract-links` Extract links from a webpage using HTMLRewriter
- `extract-social-meta` Extract social share images and Open Graph tags

### guides/http

- `cluster` Start a cluster of HTTP servers — Run multiple HTTP servers concurrently with the "reusePort" option to share the same port across multiple proc
- `fetch-unix` fetch with unix domain sockets in Bun
- `fetch` Send an HTTP request using fetch
- `file-uploads` Upload files via HTTP using FormData
- `hot` Hot reload an HTTP server
- `proxy` Proxy HTTP requests using fetch()
- `server` Common HTTP server usage
- `simple` Write a simple HTTP server
- `sse` Server-Sent Events (SSE) with Bun
- `stream-file` Stream a file as an HTTP Response
- `stream-iterator` Streaming HTTP Server with Async Iterators
- `stream-node-streams-in-bun` Streaming HTTP Server with Node.js Streams
- `tls` Configure TLS on an HTTP server

### guides

- `index` Guides — Code samples and walkthroughs for common tasks with Bun

### guides/install

- `add-dev` Add a development dependency
- `add-git` Add a Git dependency
- `add-optional` Add an optional dependency
- `add-peer` Add a peer dependency
- `add-tarball` Add a tarball dependency
- `add` Add a dependency
- `azure-artifacts` Using bun install with an Azure Artifacts npm registry
- `cicd` Install dependencies with Bun in GitHub Actions
- `custom-registry` Override the default npm registry for bun install
- `from-npm-install-to-bun-install` Migrate from npm install to bun install
- `git-diff-bun-lockfile` Configure git to diff Bun's lockb lockfile
- `jfrog-artifactory` Using bun install with Artifactory
- `npm-alias` Install a package under a different name
- `registry-scope` Configure a private registry for an organization scope with bun install
- `trusted` Add a trusted dependency
- `workspaces` Configuring a monorepo using workspaces
- `yarnlock` Generate a yarn-compatible lockfile

### guides/lint

- `migrate-from-eslint` Migrate from ESLint to bun lint
- `migrate-from-oxlint` Migrate from oxlint to bun lint

### guides/process

- `argv` Parse command-line arguments
- `ctrl-c` Listen for CTRL+C
- `ipc` Spawn a child process and communicate using IPC
- `nanoseconds` Get the process uptime in nanoseconds
- `os-signals` Listen to OS signals
- `spawn-stderr` Read stderr from a child process
- `spawn-stdout` Read stdout from a child process
- `spawn` Spawn a child process
- `stdin` Read from stdin

### guides/read-file

- `arraybuffer` Read a file to an ArrayBuffer
- `buffer` Read a file to a Buffer
- `exists` Check if a file exists
- `json` Read a JSON file
- `mime` Get the MIME type of a file
- `stream` Read a file as a ReadableStream
- `string` Read a file as a string
- `uint8array` Read a file to a Uint8Array
- `watch` Watch a directory for changes

### guides/runtime

- `build-time-constants` Build-time constants with --define
- `cicd` Install and run Bun in GitHub Actions
- `codesign-macos-executable` Codesign a single-file JavaScript executable on macOS — Fix the "can't be opened because it is from an unidentified developer" Gatekeeper warning when running your Ja
- `define-constant` Define and replace static globals & constants
- `delete-directory` Delete directories
- `delete-file` Delete files
- `heap-snapshot` Inspect memory usage using V8 heap snapshots
- `import-html` Import a HTML file as text
- `import-json` Import a JSON file
- `import-json5` Import a JSON5 file
- `import-toml` Import a TOML file
- `import-xml` Import an XML file
- `import-yaml` Import a YAML file
- `read-env` Read environment variables
- `set-env` Set environment variables
- `shell` Run a Shell Command
- `timezone` Set a time zone in Bun
- `tsconfig-paths` Re-map import paths
- `typescript` Install TypeScript declarations for Bun
- `vscode-debugger` Debugging Bun with the VS Code extension
- `web-debugger` Debugging Bun with the web debugger

### guides/streams

- `node-readable-to-arraybuffer` Convert a Node.js Readable to an ArrayBuffer
- `node-readable-to-blob` Convert a Node.js Readable to a Blob
- `node-readable-to-json` Convert a Node.js Readable to JSON
- `node-readable-to-string` Convert a Node.js Readable to a string
- `node-readable-to-uint8array` Convert a Node.js Readable to an Uint8Array
- `to-array` Convert a ReadableStream to an array of chunks
- `to-arraybuffer` Convert a ReadableStream to an ArrayBuffer
- `to-blob` Convert a ReadableStream to a Blob
- `to-buffer` Convert a ReadableStream to a Buffer
- `to-json` Convert a ReadableStream to JSON
- `to-string` Convert a ReadableStream to a string
- `to-typedarray` Convert a ReadableStream to a Uint8Array

### guides/test

- `bail` Bail early with the Bun test runner
- `concurrent-test-glob` Selectively run tests concurrently with glob patterns — Set a glob pattern to decide which tests from which files run in parallel
- `coverage-threshold` Set a code coverage threshold with the Bun test runner
- `coverage` Generate code coverage reports with the Bun test runner
- `happy-dom` Write browser DOM tests with Bun and happy-dom
- `migrate-from-jest` Migrate from Jest to Bun's test runner
- `mock-clock` Set the system time in Bun's test runner
- `mock-functions` Mock functions in `bun test`
- `rerun-each` Re-run tests multiple times with the Bun test runner
- `run-tests` Run your tests with the Bun test runner
- `skip-tests` Skip tests with the Bun test runner
- `snapshot` Use snapshot testing in `bun test`
- `spy-on` Spy on methods in `bun test`
- `svelte-test` import, require, and test Svelte components with bun test
- `testing-library` Using Testing Library with Bun
- `timeout` Set a per-test timeout with the Bun test runner
- `todo-tests` Mark a test as a "todo" with the Bun test runner
- `update-snapshots` Update snapshots in `bun test`
- `watch-mode` Run tests in watch mode with Bun

### guides/util

- `base64` Encode and decode base64 data
- `deep-equals` Check if two objects are deeply equal
- `deflate` Compress and decompress data with DEFLATE
- `detect-bun` Detect when code is executed with Bun
- `entrypoint` Check if the current file is the entrypoint
- `escape-html` Escape an HTML string
- `file-url-to-path` Convert a file URL to an absolute path
- `gzip` Compress and decompress data with gzip
- `hash-a-password` Hash a password
- `import-meta-dir` Get the directory of the current file
- `import-meta-file` Get the file name of the current file
- `import-meta-path` Get the absolute path of the current file
- `javascript-uuid` Generate a UUID
- `main` Get the absolute path to the current entrypoint
- `path-to-file-url` Convert an absolute path to a file URL
- `sleep` Sleep for a fixed number of milliseconds
- `upgrade` Upgrade Bun to the latest version
- `version` Get the current Bun version
- `which-path-to-executable-bin` Get the path to an executable bin file

### guides/websocket

- `compression` Enable compression for WebSocket messages
- `context` Set per-socket contextual data on a WebSocket
- `pubsub` Build a publish-subscribe WebSocket server
- `simple` Build a simple WebSocket server

### guides/write-file

- `append` Append content to a file
- `basic` Write a string to a file
- `blob` Write a Blob to a file
- `cat` Write a file to stdout
- `file-cp` Copy a file to another location
- `filesink` Write a file incrementally
- `response` Write a Response to a file
- `stdout` Write to stdout
- `stream` Write a ReadableStream to a file
- `unlink` Delete a file

## project/

### project

- `benchmarking` Benchmarking — How to benchmark Bun
- `bindgen` Bindgen — Bindgen for Bun
- `building-windows` Building Windows — Building Bun on Windows
- `contributing` Contributing — Contributing to Bun
- `license` License — License for Bun
- `roadmap` Roadmap — Bun's roadmap and long-term plans

## lint/rules/ (bun lint rule docs; names only, grouped by plugin)

- **bun** (29): axios-no-unbounded-requests, consistent-directive-prefix, fast-check-no-unseeded-random, format, jsx-no-forbidden-nesting, no-array-just-to-count, no-cast-to-brand, no-console-window-flash, no-cwd-dependent-path, no-eager-dynamic-import, no-eager-native-addon, no-env-at-module-scope, no-literal-temp-dir, no-negative-repeat-count, no-redundant-catch-type, no-restricted-text, no-side-effects-on-import, no-unhandled-emitter-errors, no-unportable-commands, no-useless-spread-fallback, prefer-builtin-sleep, prefer-local-module, prefer-timeout-signal, prefer-url-for-sibling-files, react-no-latest-value-ref, react-no-local-render-helpers, react-no-namespace-hooks, react-prefer-updater-function, zod-prefer-lazy-schema
- **bun-test** (65): consistent-test-filename, consistent-test-it, expect-expect, max-expects, max-nested-describe, no-alias-methods, no-commented-out-tests, no-conditional-expect, no-conditional-in-test, no-conditional-tests, no-disabled-tests, no-done-callback, no-duplicate-hooks, no-export, no-focused-tests, no-hooks, no-identical-title, no-interpolation-in-snapshots, no-large-snapshots, no-restricted-jest-methods, no-restricted-matchers, no-standalone-expect, no-test-prefixes, no-test-return-statement, no-unneeded-async-expect-function, padding-around-after-all-blocks, padding-around-test-blocks, prefer-called-once, prefer-called-times, prefer-called-with, prefer-comparison-matcher, prefer-describe-function-title, prefer-each, prefer-ending-with-an-expect, prefer-equality-matcher, prefer-expect-assertions, prefer-expect-resolves, prefer-expect-type-of, prefer-hooks-in-order, prefer-hooks-on-top, prefer-lowercase-title, prefer-mock-promise-shorthand, prefer-mock-return-shorthand, prefer-snapshot-hint, prefer-spy-on, prefer-strict-boolean-matchers, prefer-strict-equal, prefer-to-be-falsy, prefer-to-be-truthy, prefer-to-be, prefer-to-contain, prefer-to-have-been-called-times, prefer-to-have-been-called, prefer-to-have-length, prefer-todo, require-hook, require-mock-type-parameters, require-test-timeout, require-to-throw-message, require-top-level-describe, valid-describe-callback, valid-expect-in-promise, valid-expect, valid-title, warn-todo
- **eslint** (218): accessor-pairs, array-callback-return, arrow-body-style, block-scoped-var, callback-return, camelcase, capitalized-comments, class-methods-use-this, complexity, consistent-return, consistent-this, constructor-super, curly, default-case-last, default-case, default-param-last, dot-notation, eqeqeq, for-direction, func-name-matching, func-names, func-style, getter-return, global-require, grouped-accessor-pairs, guard-for-in, handle-callback-err, id-blacklist, id-denylist, id-length, id-match, init-declarations, logical-assignment-operators, max-classes-per-file, max-depth, max-lines-per-function, max-lines, max-nested-callbacks, max-params, max-statements, new-cap, no-alert, no-array-constructor, no-async-promise-executor, no-await-in-loop, no-bitwise, no-buffer-constructor, no-caller, no-case-declarations, no-catch-shadow, no-class-assign, no-compare-neg-zero, no-cond-assign, no-console, no-const-assign, no-constant-binary-expression, no-constant-condition, no-constructor-return, no-continue, no-control-regex, no-debugger, no-delete-var, no-div-regex, no-dupe-args, no-dupe-class-members, no-dupe-else-if, no-dupe-keys, no-duplicate-case, no-duplicate-imports, no-else-return, no-empty-character-class, no-empty-function, no-empty-pattern, no-empty-static-block, no-empty, no-eq-null, no-eval, no-ex-assign, no-extend-native, no-extra-bind, no-extra-boolean-cast, no-extra-label, no-fallthrough, no-func-assign, no-global-assign, no-implicit-coercion, no-implicit-globals, no-implied-eval, no-import-assign, no-inline-comments, no-inner-declarations, no-invalid-regexp, no-invalid-this, no-irregular-whitespace, no-iterator, no-label-var, no-labels, no-lone-blocks, no-lonely-if, no-loop-func, no-loss-of-precision, no-magic-numbers, no-misleading-character-class, no-mixed-requires, no-multi-assign, no-multi-str, no-native-reassign, no-negated-condition, no-negated-in-lhs, no-nested-ternary, no-new-func, no-new-native-nonconstructor, no-new-object, no-new-require, no-new-symbol, no-new-wrappers, no-new, no-nonoctal-decimal-escape, no-obj-calls, no-object-constructor, no-octal-escape, no-octal, no-param-reassign, no-path-concat, no-plusplus, no-process-env, no-process-exit, no-promise-executor-return, no-proto, no-prototype-builtins, no-redeclare, no-regex-spaces, no-restricted-exports, no-restricted-globals, no-restricted-imports, no-restricted-modules, no-restricted-properties, no-restricted-syntax, no-return-assign, no-return-await, no-script-url, no-self-assign, no-self-compare, no-sequences, no-setter-return, no-shadow-restricted-names, no-shadow, no-sparse-arrays, no-sync, no-template-curly-in-string, no-ternary, no-this-before-super, no-throw-literal, no-unassigned-vars, no-undef-init, no-undef, no-undefined, no-underscore-dangle, no-unexpected-multiline, no-unmodified-loop-condition, no-unneeded-ternary, no-unreachable-loop, no-unreachable, no-unsafe-finally, no-unsafe-negation, no-unsafe-optional-chaining, no-unused-expressions, no-unused-labels, no-unused-private-class-members, no-unused-vars, no-use-before-define, no-useless-assignment, no-useless-backreference, no-useless-call, no-useless-catch, no-useless-computed-key, no-useless-concat, no-useless-constructor, no-useless-escape, no-useless-rename, no-useless-return, no-var, no-void, no-warning-comments, no-with, object-shorthand, one-var, operator-assignment, prefer-arrow-callback, prefer-const, prefer-destructuring, prefer-exponentiation-operator, prefer-named-capture-group, prefer-numeric-literals, prefer-object-has-own, prefer-object-spread, prefer-promise-reject-errors, prefer-reflect, prefer-regex-literals, prefer-rest-params, prefer-spread, prefer-template, preserve-caught-error, radix, require-atomic-updates, require-await, require-unicode-regexp, require-yield, sort-imports, sort-keys, sort-vars, strict, symbol-description, unicode-bom, use-isnan, valid-typeof, vars-on-top, yoda
- **import** (46): consistent-type-specifier-style, default, dynamic-import-chunkname, enforce-node-protocol-usage, export, exports-last, extensions, first, group-exports, imports-first, max-dependencies, named, namespace, newline-after-import, no-absolute-path, no-amd, no-anonymous-default-export, no-commonjs, no-cycle, no-default-export, no-deprecated, no-duplicates, no-dynamic-require, no-empty-named-blocks, no-extraneous-dependencies, no-import-module-exports, no-internal-modules, no-mutable-exports, no-named-as-default-member, no-named-as-default, no-named-default, no-named-export, no-namespace, no-nodejs-modules, no-relative-packages, no-relative-parent-imports, no-restricted-paths, no-self-import, no-unassigned-import, no-unresolved, no-unused-modules, no-useless-path-segments, no-webpack-loader-syntax, order, prefer-default-export, unambiguous
- **jest** (60): consistent-test-it, expect-expect, max-expects, max-nested-describe, no-alias-methods, no-commented-out-tests, no-conditional-expect, no-conditional-in-test, no-confusing-set-timeout, no-deprecated-functions, no-disabled-tests, no-done-callback, no-duplicate-hooks, no-export, no-focused-tests, no-hooks, no-identical-title, no-interpolation-in-snapshots, no-jasmine-globals, no-large-snapshots, no-mocks-import, no-restricted-jest-methods, no-restricted-matchers, no-standalone-expect, no-test-prefixes, no-test-return-statement, no-unneeded-async-expect-function, no-untyped-mock-factory, padding-around-after-all-blocks, padding-around-test-blocks, prefer-called-with, prefer-comparison-matcher, prefer-each, prefer-ending-with-an-expect, prefer-equality-matcher, prefer-expect-assertions, prefer-expect-resolves, prefer-hooks-in-order, prefer-hooks-on-top, prefer-importing-jest-globals, prefer-jest-mocked, prefer-lowercase-title, prefer-mock-promise-shorthand, prefer-mock-return-shorthand, prefer-snapshot-hint, prefer-spy-on, prefer-strict-equal, prefer-to-be, prefer-to-contain, prefer-to-have-been-called-times, prefer-to-have-been-called, prefer-to-have-length, prefer-todo, require-hook, require-to-throw-message, require-top-level-describe, valid-describe-callback, valid-expect-in-promise, valid-expect, valid-title
- **json** (6): no-duplicate-keys, no-empty-keys, no-unnormalized-keys, no-unsafe-values, sort-keys, top-level-interop
- **jsx-a11y** (36): alt-text, anchor-ambiguous-text, anchor-has-content, anchor-is-valid, aria-activedescendant-has-tabindex, aria-props, aria-proptypes, aria-role, aria-unsupported-elements, autocomplete-valid, click-events-have-key-events, control-has-associated-label, heading-has-content, html-has-lang, iframe-has-title, img-redundant-alt, interactive-supports-focus, label-has-associated-control, lang, media-has-caption, mouse-events-have-key-events, no-access-key, no-aria-hidden-on-focusable, no-autofocus, no-distracting-elements, no-interactive-element-to-noninteractive-role, no-noninteractive-element-interactions, no-noninteractive-element-to-interactive-role, no-noninteractive-tabindex, no-redundant-roles, no-static-element-interactions, prefer-tag-over-role, role-has-required-aria-props, role-supports-aria-props, scope, tabindex-no-positive
- **markdown** (21): fenced-code-language, fenced-code-meta, heading-increment, no-bare-urls, no-duplicate-definitions, no-duplicate-headings, no-empty-definitions, no-empty-images, no-empty-links, no-html, no-invalid-label-refs, no-missing-atx-heading-space, no-missing-label-refs, no-missing-link-fragments, no-multiple-h1, no-reference-like-urls, no-reversed-media-syntax, no-space-in-emphasis, no-unused-definitions, require-alt-text, table-column-count
- **nextjs** (21): google-font-display, google-font-preconnect, inline-script-id, next-script-for-ga, no-assign-module-variable, no-async-client-component, no-before-interactive-script-outside-document, no-css-tags, no-document-import-in-page, no-duplicate-head, no-head-element, no-head-import-in-document, no-html-link-for-pages, no-img-element, no-page-custom-font, no-script-component-in-head, no-styled-jsx-in-document, no-sync-scripts, no-title-in-document-head, no-typos, no-unwanted-polyfillio
- **node** (15): callback-return, exports-style, global-require, handle-callback-err, no-exports-assign, no-mixed-requires, no-new-require, no-path-concat, no-process-env, no-process-exit, no-sync, no-top-level-await, no-unsupported-features/es-builtins, no-unsupported-features/es-syntax, no-unsupported-features/node-builtins
- **oxc** (27): approx-constant, bad-array-method-on-arguments, bad-bitwise-operator, bad-char-at-comparison, bad-comparison-sequence, bad-match-all-arg, bad-min-max-func, bad-object-literal-comparison, bad-replace-all-arg, branches-sharing-code, const-comparisons, double-comparisons, erasing-op, misrefactored-assign-op, missing-throw, no-accumulating-spread, no-async-await, no-async-endpoint-handlers, no-barrel-file, no-const-enum, no-map-spread, no-optional-chaining, no-rest-spread-properties, no-this-in-exported-function, number-arg-out-of-range, only-used-in-recursion, uninvoked-array-callback
- **prettier** (1): prettier
- **promise** (16): always-return, avoid-new, catch-or-return, no-callback-in-promise, no-multiple-resolved, no-nesting, no-new-statics, no-promise-in-callback, no-return-in-finally, no-return-wrap, param-names, prefer-await-to-callbacks, prefer-await-to-then, prefer-catch, spec-only, valid-params
- **react** (135): boolean-prop-naming, button-has-type, capitalized-calls, checked-requires-onchange-or-readonly, component-hook-factories, config, default-props-match-prop-types, destructuring-assignment, display-name, error-boundaries, exhaustive-deps, exhaustive-effect-dependencies, fbt, forbid-component-props, forbid-dom-props, forbid-elements, forbid-foreign-prop-types, forbid-prop-types, forward-ref-uses-ref, function-component-definition, gating, globals, hook-use-state, hooks, iframe-missing-sandbox, immutability, incompatible-library, invariant, jsx-boolean-value, jsx-child-element-spacing, jsx-closing-bracket-location, jsx-closing-tag-location, jsx-curly-brace-presence, jsx-curly-newline, jsx-curly-spacing, jsx-equals-spacing, jsx-filename-extension, jsx-first-prop-new-line, jsx-fragments, jsx-handler-names, jsx-indent-props, jsx-indent, jsx-key, jsx-max-depth, jsx-max-props-per-line, jsx-newline, jsx-no-bind, jsx-no-comment-textnodes, jsx-no-constructed-context-values, jsx-no-duplicate-props, jsx-no-leaked-render, jsx-no-literals, jsx-no-script-url, jsx-no-target-blank, jsx-no-undef, jsx-no-useless-fragment, jsx-one-expression-per-line, jsx-pascal-case, jsx-props-no-multi-spaces, jsx-props-no-spread-multi, jsx-props-no-spreading, jsx-sort-default-props, jsx-sort-props, jsx-tag-spacing, jsx-uses-react, jsx-uses-vars, jsx-wrap-multilines, memo-dependencies, memoized-effect-dependencies, no-access-state-in-setstate, no-adjacent-inline-elements, no-array-index-key, no-arrow-function-lifecycle, no-children-prop, no-clone-element, no-danger-with-children, no-danger, no-deprecated, no-deriving-state-in-effects, no-did-mount-set-state, no-did-update-set-state, no-direct-mutation-state, no-find-dom-node, no-invalid-html-attribute, no-is-mounted, no-multi-comp, no-namespace, no-object-type-as-default-prop, no-react-children, no-redundant-should-component-update, no-render-return-value, no-set-state, no-string-refs, no-this-in-sfc, no-typos, no-unescaped-entities, no-unknown-property, no-unsafe, no-unstable-nested-components, no-unused-class-component-methods, no-unused-prop-types, no-unused-state, no-will-update-set-state, only-export-components, prefer-es6-class, prefer-exact-props, prefer-function-component, prefer-read-only-props, prefer-stateless-function, preserve-manual-memoization, prop-types, purity, react-in-jsx-scope, refs, require-default-props, require-optimization, require-render-return, rule-suppression, rules-of-hooks, self-closing-comp, set-state-in-effect, set-state-in-render, sort-comp, sort-default-props, sort-prop-types, state-in-constructor, static-components, static-property-placement, style-prop-object, syntax, todo, unsupported-syntax, use-memo, void-dom-elements-no-children, void-use-memo
- **react-perf** (4): jsx-no-jsx-as-prop, jsx-no-new-array-as-prop, jsx-no-new-function-as-prop, jsx-no-new-object-as-prop
- **typescript** (137): adjacent-overload-signatures, array-type, await-thenable, ban-ts-comment, ban-tslint-comment, ban-types, class-literal-property-style, class-methods-use-this, consistent-generic-constructors, consistent-indexed-object-style, consistent-return, consistent-type-assertions, consistent-type-definitions, consistent-type-exports, consistent-type-imports, default-param-last, dot-notation, explicit-function-return-type, explicit-member-accessibility, explicit-module-boundary-types, init-declarations, max-params, member-ordering, method-signature-style, naming-convention, no-array-constructor, no-array-delete, no-base-to-string, no-confusing-non-null-assertion, no-confusing-void-expression, no-deprecated, no-dupe-class-members, no-duplicate-enum-values, no-duplicate-type-constituents, no-dynamic-delete, no-empty-function, no-empty-interface, no-empty-object-type, no-explicit-any, no-extra-non-null-assertion, no-extraneous-class, no-floating-promises, no-for-in-array, no-generated-empty-object-type, no-implied-eval, no-import-type-side-effects, no-inferrable-types, no-invalid-this, no-invalid-void-type, no-loop-func, no-loss-of-precision, no-magic-numbers, no-meaningless-void-operator, no-misused-new, no-misused-promises, no-misused-spread, no-mixed-enums, no-namespace, no-non-null-asserted-nullish-coalescing, no-non-null-asserted-optional-chain, no-non-null-assertion, no-redeclare, no-redundant-type-constituents, no-require-imports, no-restricted-imports, no-restricted-types, no-shadow, no-this-alias, no-type-alias, no-unnecessary-boolean-literal-compare, no-unnecessary-condition, no-unnecessary-parameter-property-assignment, no-unnecessary-qualifier, no-unnecessary-template-expression, no-unnecessary-type-arguments, no-unnecessary-type-assertion, no-unnecessary-type-constraint, no-unnecessary-type-conversion, no-unnecessary-type-parameters, no-unsafe-argument, no-unsafe-assignment, no-unsafe-call, no-unsafe-declaration-merging, no-unsafe-enum-assignment, no-unsafe-enum-comparison, no-unsafe-function-type, no-unsafe-member-access, no-unsafe-return, no-unsafe-type-assertion, no-unsafe-unary-minus, no-unused-expressions, no-unused-private-class-members, no-unused-vars, no-use-before-define, no-useless-constructor, no-useless-default-assignment, no-useless-empty-export, no-var-requires, no-wrapper-object-types, non-nullable-type-assertion-style, only-throw-error, parameter-properties, prefer-as-const, prefer-destructuring, prefer-enum-initializers, prefer-find, prefer-for-of, prefer-function-type, prefer-includes, prefer-literal-enum-member, prefer-namespace-keyword, prefer-nullish-coalescing, prefer-optional-chain, prefer-promise-reject-errors, prefer-readonly-parameter-types, prefer-readonly, prefer-reduce-type-parameter, prefer-regexp-exec, prefer-return-this-type, prefer-string-starts-ends-with, prefer-ts-expect-error, promise-function-async, related-getter-setter-pairs, require-array-sort-compare, require-await, restrict-plus-operands, restrict-template-expressions, return-await, sort-type-constituents, strict-boolean-expressions, strict-void-return, switch-exhaustiveness-check, triple-slash-reference, typedef, unbound-method, unified-signatures, use-unknown-in-catch-callback-variable
- **unicorn** (138): catch-error-name, consistent-assert, consistent-date-clone, consistent-empty-array-spread, consistent-existence-index-check, consistent-function-scoping, consistent-template-literal-escape, custom-error-definition, empty-brace-spaces, error-message, escape-case, explicit-length-check, explicit-timer-delay, filename-case, import-style, max-nested-calls, new-for-builtins, no-abusive-eslint-disable, no-accessor-recursion, no-anonymous-default-export, no-array-callback-reference, no-array-fill-with-reference-type, no-array-for-each, no-array-method-this-argument, no-array-reduce, no-array-reverse, no-array-sort, no-await-expression-member, no-await-in-promise-methods, no-confusing-array-with, no-console-spaces, no-document-cookie, no-empty-file, no-hex-escape, no-immediate-mutation, no-instanceof-array, no-instanceof-builtins, no-invalid-fetch-options, no-invalid-remove-event-listener, no-length-as-slice-end, no-lonely-if, no-magic-array-flat-depth, no-negated-condition, no-negation-in-equality-check, no-nested-ternary, no-new-array, no-new-buffer, no-null, no-object-as-default-parameter, no-process-exit, no-single-promise-in-promise-methods, no-static-only-class, no-thenable, no-this-assignment, no-typeof-undefined, no-unnecessary-array-flat-depth, no-unnecessary-array-splice-count, no-unnecessary-await, no-unnecessary-slice-end, no-unreadable-array-destructuring, no-unreadable-iife, no-useless-collection-argument, no-useless-error-capture-stack-trace, no-useless-fallback-in-spread, no-useless-iterator-to-array, no-useless-length-check, no-useless-promise-resolve-reject, no-useless-spread, no-useless-switch-case, no-useless-undefined, no-zero-fractions, number-literal-case, numeric-separators-style, prefer-add-event-listener, prefer-array-find, prefer-array-flat-map, prefer-array-flat, prefer-array-index-of, prefer-array-some, prefer-at, prefer-bigint-literals, prefer-blob-reading-methods, prefer-class-fields, prefer-classlist-toggle, prefer-code-point, prefer-date-now, prefer-default-parameters, prefer-dom-node-append, prefer-dom-node-dataset, prefer-dom-node-remove, prefer-dom-node-text-content, prefer-event-target, prefer-export-from, prefer-global-this, prefer-import-meta-properties, prefer-includes, prefer-keyboard-event-key, prefer-logical-operator-over-ternary, prefer-math-min-max, prefer-math-trunc, prefer-modern-dom-apis, prefer-modern-math-apis, prefer-module, prefer-native-coercion-functions, prefer-negative-index, prefer-node-protocol, prefer-number-coercion, prefer-number-properties, prefer-object-from-entries, prefer-optional-catch-binding, prefer-prototype-methods, prefer-query-selector, prefer-reflect-apply, prefer-regexp-test, prefer-response-static-json, prefer-set-has, prefer-set-size, prefer-single-call, prefer-spread, prefer-string-raw, prefer-string-replace-all, prefer-string-slice, prefer-string-starts-ends-with, prefer-string-trim-start-end, prefer-structured-clone, prefer-ternary, prefer-top-level-await, prefer-type-error, relative-url-style, require-array-join-separator, require-module-attributes, require-module-specifiers, require-number-to-fixed-digits-argument, require-post-message-target-origin, switch-case-braces, switch-case-break-position, text-encoding-identifier-case, throw-new-error
- **vitest** (73): consistent-each-for, consistent-test-filename, consistent-test-it, consistent-vitest-vi, expect-expect, hoisted-apis-on-top, max-expects, max-nested-describe, no-alias-methods, no-commented-out-tests, no-conditional-expect, no-conditional-in-test, no-conditional-tests, no-disabled-tests, no-duplicate-hooks, no-focused-tests, no-hooks, no-identical-title, no-import-node-test, no-importing-vitest-globals, no-interpolation-in-snapshots, no-large-snapshots, no-mocks-import, no-restricted-matchers, no-restricted-vi-methods, no-standalone-expect, no-test-prefixes, no-test-return-statement, no-unneeded-async-expect-function, padding-around-after-all-blocks, padding-around-test-blocks, prefer-called-exactly-once-with, prefer-called-once, prefer-called-times, prefer-called-with, prefer-comparison-matcher, prefer-describe-function-title, prefer-each, prefer-equality-matcher, prefer-expect-assertions, prefer-expect-resolves, prefer-expect-type-of, prefer-hooks-in-order, prefer-hooks-on-top, prefer-import-in-mock, prefer-importing-vitest-globals, prefer-lowercase-title, prefer-mock-promise-shorthand, prefer-mock-return-shorthand, prefer-snapshot-hint, prefer-spy-on, prefer-strict-boolean-matchers, prefer-strict-equal, prefer-to-be-falsy, prefer-to-be-object, prefer-to-be-truthy, prefer-to-be, prefer-to-contain, prefer-to-have-been-called-times, prefer-to-have-length, prefer-todo, require-awaited-expect-poll, require-hook, require-local-test-context-for-concurrent-snapshots, require-mock-type-parameters, require-test-timeout, require-to-throw-message, require-top-level-describe, valid-describe-callback, valid-expect-in-promise, valid-expect, valid-title, warn-todo
