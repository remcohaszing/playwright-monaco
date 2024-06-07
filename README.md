# playwright-monaco

[![github actions](https://github.com/remcohaszing/playwright-monaco/actions/workflows/ci.yaml/badge.svg)](https://github.com/remcohaszing/playwright-monaco/actions/workflows/ci.yaml)
[![npm version](https://img.shields.io/npm/v/playwright-monaco)](https://www.npmjs.com/package/playwright-monaco)
[![npm downloads](https://img.shields.io/npm/dm/playwright-monaco)](https://www.npmjs.com/package/playwright-monaco)
[![codecov](https://codecov.io/gh/remcohaszing/playwright-monaco/branch/main/graph/badge.svg)](https://codecov.io/gh/remcohaszing/playwright-monaco)

Test [Monaco editor](https://microsoft.github.io/monaco-editor) integrations using
[Playwright](https://playwright.dev).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`createServer(entryPoints[, options])`](#createserverentrypoints-options)
  - [`monaco`](#monaco)
  - [`ed`](#ed)
  - [`test(name, fn)`](#testname-fn)
  - [`editor` fixture](#editor-fixture)
  - [`trigger(handlerId[, payload])`](#triggerhandlerid-payload)
  - [`waitForMarkers(uri, fn)`](#waitformarkersuri-fn)
- [License](#license)

## Installation

```sh
npm install playwright-monaco
```

## Usage

First, create an entry point that sets up your Monaco editor integration. Your integration should
not import Monaco editor. Instead, it should accept the Monaco editor module as an argument. This
best practice makes sure your integration also works with other ways to load Monaco editor. For
example many users load Monaco editor from a CDN. The `ed` and `monaco` variables are assigned
globally for convenience, but you can import them for type safety.

```typescript
// ./tests/setup-monaco.ts
import { ed, monaco } from 'playwright-monaco'

import { configure } from '../src/index.js'

configure(monaco)
```

In your Playwright config, call `createServer` with your entry points. This starts a webserver using
esbuild [serve](https://esbuild.github.io/api/#serve). This serves a page containing a fully
configured Monaco editor. All default web workers are configured and a full page editor instance is
created.

```typescript
// ./playwright.config.ts
import { type PlaywrightTestConfig } from '@playwright/test'
import { createServer } from 'playwright-monaco'

const config: PlaywrightTestConfig = {
  use: {
    baseURL: await createServer('./tests/setup-monaco')
    // Alternatively, if you need a web worker
    // baseURL: await createServer({
    //   setup: './tests/setup-monaco',
    //   'your-integration': './src/your-integration.worker'
    // })

    // The editor respects dark mode if configured
    //  colorScheme: 'dark'
  }
}

export default config
```

Now create a test which uses the `editor` fixture. The `editor` fixture navigates to the page
served, and contains some convenience functions for working with Monaco editor.

```typescript
// ./tests/integration.spec.ts
import { test } from 'playwright-monaco'

test('your integration', async ({ editor }) => {
  await editor.createModel('console.log("Hello Monaco!")\n', 'file:///index.js', true)
})
```

## API

### `createServer(entryPoints[, options])`

Create an esbuild dev server which serves Monaco editor.

#### Parameters:

- `entryPoints`: A string or object that contains the `setup` key. These entry points will be built
  and loaded using esbuild.
- `options`: Optional additional configuration options. The following options are accepted:
  - `alias`: Substitute packages with an alternative.
  - `port`: The port on which to serve the page.

### `monaco`

The global Monaco editor module. This can only be used in the browser.

### `ed`

The global Monaco editor instance. This can only be used in the browser.

### `test(name, fn)`

A Playwright [test](https://playwright.dev/docs/writing-tests) instance that has been extended with
the `editor` fixture.

### `editor` fixture

The `editor` fixture is a Playwright [handle](https://playwright.dev/docs/handles) attached to the
`window`. It’s configured to allow type-safe access to the `ed` and `monaco` globals as well. In
addition, the `editor` fixture has the following helper functions:

#### `createModel(value[, pathOrUri[, open[, language]]])`

Create a Monaco editor model.

##### Parameters

- `value`: The value to set. (`string`)
- `pathOrUri`: The path or uri of the model. If a path is given, it will be converted to a file uri.
  (`URL` | `string`)
- `open`: If set to true, the created model is opened in the editor. (`boolean`)
- `language`: The model language. By default this is auto detected based on the uri. (`string`)

##### Returns

A Playwright handle for the model.

#### `open(patterns[, options])`

Open one or more files from the file system in Monaco editor.

##### Parameters

- `pattern`: A glob pattern or array of glob patterns to open in the editor. (`string` | `string[]`)
- `options`: Options to pass to globby. The `cwd` option is also used to determine the base path of
  the models. See [globby options](https://github.com/sindresorhus/globby#options) for details.
  (`object`)

#### `setModel(uri)`

Open an existing model in the editor.

##### Parameters

- `uri`: The uri of the model to open. (`string`)

#### `setPosition(position)`

Set the position in the editor

#### Parameters

- `position`: THe position to set. (`object`)

### `trigger(handlerId[, payload])`

Trigger an editor action.

#### Parameters

- `handlerId`: The id of the action to trigger. (`string`)
- `payload`: An additional payload to send with the action. (`any`)

#### Returns

The result of the action.

### `waitForMarkers(uri, fn)`

Wait for marker data to be triggered for a resource.

#### Parameters

- `uri` The resource uri to wait for markers for. (`string`)
- `fn` A function to evaluate to trigger marker data. (`function`)

#### Returns

Marker data for the uri.

## License

[MIT](LICENSE.md) © [Remco Haszing](https://github.com/remcohaszing)
