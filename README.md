<p align="center">
  <img src="assets/logo.png" alt="Azion Bundler Logo" width="200"/>
</p>

# Azion Bundler - Built for Builders of the Edge

[![Version](https://img.shields.io/npm/v/edge-functions.svg)](https://www.npmjs.com/package/edge-functions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Downloads](https://img.shields.io/npm/dm/edge-functions.svg)](https://www.npmjs.com/package/edge-functions)
[![GitHub Stars](https://img.shields.io/github/stars/aziontech/bundler.svg)](https://github.com/aziontech/bundler/stargazers)
[![Maintainers](https://img.shields.io/badge/maintainers-jotanarciso,%20jcbsfilho-blue.svg)](https://github.com/aziontech/bundler/graphs/contributors)

Azion Bundler is a powerful tool designed to build and adapt projects for edge computing. It handles module resolution and applies necessary polyfills through [unjs/unenv](https://github.com/unjs/unenv) while providing an abstraction layer over popular bundlers like esbuild and webpack. The tool includes a local development environment for testing and debugging, and processes Infrastructure as Code (IaC) through its manifest system.

## Table of Contents

- [Azion Bundler - Built for Builders of the Edge](#azion-bundler---built-for-builders-of-the-edge)
  - [Table of Contents](#table-of-contents)
  - [Quick Installation](#quick-installation)
  - [Getting Started for Development](#getting-started-for-development)
  - [Using](#using)
  - [Commands](#commands)
    - [`build`](#build)
    - [`dev`](#dev)
    - [`store`](#store)
    - [`presets`](#presets)
    - [`manifest`](#manifest)
  - [Configuration](#configuration)
  - [Build Process Flow](#build-process-flow)
  - [Documentation](#documentation)
  - [Supported Features](#supported-features)
  - [Contributing](#contributing)
  - [License](#license)

## Quick Installation

For those who just want to use Azion Bundler in their project without contributing to the development, you can install it directly from npm.

```shell
npm install edge-functions
```

or if you prefer yarn:

```shell
yarn add edge-functions
```

## Getting Started for Development

Follow these steps to start using Azion Bundler:

1. Clone the repository: Clone the Azion Bundler repository from GitHub to your local machine.

   ```shell
   git clone https://github.com/aziontech/bundler.git
   ```

2. Installation: Navigate to the cloned Azion Bundler directory and install the required dependencies.

   ```shell
   cd bundler
   npm yarn install
   ```

3. Install the Azion Bundler CLI globally, which allows you to use it as a command-line tool from anywhere in your system.

   ```shell
   npm install -g
   ```

   This command sets up the necessary project structure and configuration files for Azion Bundler.

4. Start developing: Once the project is set up, you can start developing your JavaScript applications or frameworks using the power of Bundler.

## Using

See some examples below:

- Build a JavaScript/Node project (back-end)

  ```shell
  ef build
  ```

- Build a TypeScript/Node (back-end)

  ```shell
  ef build --preset typescript
  ```

- Build a Next.js project

  ```shell
  ef build --preset next
  ```

- Build Astro.js project

  ```shell
  ef build --preset astro
  ```

- Test your project locally (after build)

  ```shell
  ef dev
  ```

## Commands

The Azion Bundler CLI provides several commands to help you manage your edge applications:

### `build`
Builds your project for edge deployment.

```shell
ef build [options]

Options:
  --entry <string>     Code entrypoint (default: ./handler.js or ./handler.ts)
  --preset <type>      Preset of build target (e.g., vue, next, javascript)
  --polyfills          Use node polyfills in build (default: true)
  --worker            Enable worker mode with addEventListener signature (default: false)
  --development       Build in development mode (default: false)
```

### `dev`
Starts a local development environment.

```shell
ef dev [entry] [options]

Arguments:
  entry               Specify the entry file (default: .edge/functions/handler.dev.js)

Options:
  -p, --port <port>  Specify the port (default: "3333")
```

### `store`
Manages store configuration.

```shell
ef store <command> [options]

Commands:
  init                Initialize store configuration
  destroy             Remove store configuration

Options:
  --scope <scope>     Project scope (default: "global")
  --preset <string>   Preset name
  --entry <string>    Code entrypoint
  --bundler <type>    Bundler type (webpack/esbuild)
  --polyfills        Use node polyfills in build
  --worker           Enable worker mode
```

### `presets`
Lists available project presets.

```shell
ef presets <command>

Commands:
  ls                  List all available presets
```

### `manifest`
Manages manifest files for Azion.

```shell
ef manifest [action] [options]

Arguments:
  action             Action to perform: "transform" (JSON to JS) or "generate" (config to manifest)
                    (default: "generate")

Options:
  --entry <path>     Path to the input file or configuration file
  --output <path>    Output file/directory path

Examples:
  $ ef manifest transform --entry=manifest.json --output=azion.config.js
  $ ef manifest generate --entry=azion.config.js --output=.edge
  $ ef manifest --entry=azion.config.js --output=.edge
```

## Configuration

The configuration file (`azion.config.js` or `azion.config.ts`) offers a robust configuration system for Bundler. With Azion Bundler, you can extend configurations and leverage pre-configured framework presets for immediate use. The tool empowers users to create their own automations and extensions, making it highly customizable for specific project needs.

As the JavaScript engine powering the [Azion CLI](https://github.com/aziontech/azion), it seamlessly integrates with [Azion Libraries](https://github.com/aziontech/lib) to read presets and pre-configured bundler settings from `azion/bundler` and framework presets from `azion/presets`. The bundler follows a modular architecture with specialized modules like `@build`, `@prebuild`, and `@postbuild` through the `build` command.

The configuration is divided into two main areas:
- The `build` property manages all bundler-related settings, including entry points, presets, and build configurations
- Other properties (like domain, origin, cache, rules) are related to Azion CDN and Edge Computing platform settings

While these hooks are pre-configured in framework presets, you can customize them in your `azion.config.ts` to fit your specific needs. You can either create your own configuration from scratch or extend existing presets. Here's an example of extending the Next.js preset:

```typescript
import { defineConfig } from 'azion';
import type { AzionPrebuildResult, AzionConfig } from 'azion/config';
import { Next } from 'azion/presets';

export default defineConfig({
  build: {
    preset: {
      ...Next,
      config: {
        ...Next.config,
        bundler: 'esbuild',
        extend: (config) => {
          config.define = {
            ...config.define,
            'global.customFeature': 'JSON.stringify(true)',
            'process.env.CUSTOM_VAR': 'JSON.stringify("value")'
          }
          return config
        }
      },
      prebuild: async (config: AzionConfig, ctx: BuildContext): Promise<AzionPrebuildResult> => {
        // Your custom prebuild logic here
        const result = await doSomething();
        return {
          ...result,
          // Additional prebuild configurations
        }
      }
    }
  }
});
```

## Build Process Flow

1. **Preset Resolution** (`@modules/preset`)
   - Resolves preset from string name or custom module
   - Loads built-in presets from azion/presets
   - Validates preset interface

2. **Build Config Setup** (`@modules/config`)
   - Resolves configuration priorities in the following order:
     1. CLI arguments (highest priority)
     2. User config file (`azion.config.js`)
     3. Local store settings
     4. Preset defaults (lowest priority)
   - Sets up bundler configuration
   - Configures build options and extensions

3. **Handler Resolution** (`@modules/handler`)
   - Resolves entry point/handler from CLI args, preset, or user config (azion.config.js)
   - Validates file existence

4. **Worker Setup** (`@modules/worker`)
   - Converts ESM exports to worker format
   - Injects worker runtime and globals
   - Sets up event listeners

5. **Prebuild Phase** (`@modules/prebuild`)
   - Executes preset's prebuild hooks

6. **Core Build** (`@modules/core`)
   - Processes bundler configuration (esbuild/webpack)
   - Handles file imports and dependencies
   - Applies polyfills and transformations

7. **Postbuild Phase** (`@modules/postbuild`)
   - Executes preset's postbuild hooks

8. **Environment Setup** (`@modules/environment`)
   - Creates initial `azion.config.js` from preset if none exists
   - Merges configurations (user config takes precedence over preset defaults)
   - Stores build settings locally for development and subsequent builds

## Documentation

- [Nextjs](docs/nextjs.md)
- [Rust/Wasm example](https://github.com/aziontech/bundler-examples/tree/main/examples/rust-wasm-yew-ssr/)
- [Emscripten/Wasm example](https://github.com/aziontech/bundler-examples/tree/main/examples/emscripten-wasm/)
- [Env vars example](https://github.com/aziontech/bundler-examples/tree/main/examples/javascript/simple-js-env-vars)
- [Storage example](https://github.com/aziontech/bundler-examples/tree/main/examples/javascript/simple-js-esm-storage)
- [Firewall example](https://github.com/aziontech/bundler-examples/tree/main/examples/javascript/simple-js-firewall-event)

## Supported Features

E2E tests run daily in the [Bundler Examples](https://github.com/aziontech/bundler-examples/tree/main/examples) to ensure that the presets and frameworks continue to work correctly.

Table:
| Test                                 | Status |
| ------------------------------------ | ------ |
| Next 14 2 15 Middleware              | ✅      |
| Next 13 5 6 I18n                     | ✅      |
| Next 12 3 4 I18n                     | ✅      |
| Hexo Static                          | ✅      |
| Next 13 5 6 Middleware               | ✅      |
| Next 12 3 4 Middleware               | ✅      |
| Next Node Pages 12 3 1               | ✅      |
| Next 13 5 6 Config                   | ✅      |
| Next 12 3 4 Config                   | ✅      |
| Next Static                          | ✅      |
| Gatsby Static                        | ✅      |
| Next Node Pages 12 3 1 Fs            | ✅      |
| Vue Vite Static                      | ⚠️     |
| Next 12 Static                       | ✅      |
| Astro Static                         | ✅      |
| Qwik Static                          | ✅      |
| Simple Js Env Vars                   | ✅      |
| Eleventy Static                      | ✅      |
| Simple Js Network List               | ✅      |
| Angular Static                       | ✅      |
| React Static                         | ✅      |
| Svelte Static                        | ✅      |
| Stencil Static                       | ✅      |
| Vitepress Static                     | ✅      |
| Preact Static                        | ✅      |
| Vuepress Static                      | ✅      |
| Nuxt Static                          | ✅      |
| Docusaurus Static                    | ✅      |
| Simple Js Firewall Event             | ⚠️     |
| Simple Js Network List With Firewall | ✅      |
| Jekyll Static                        | ✅      |
| Simple Js Esm Worker                 | ✅      |
| Simple Js Esm Node                   | ✅      |
| Simple Ts Esm                        | ✅      |
| Simple Js Esm                        | ✅      |

Last test run date: 06/08/25 04:01:09 AM

## Contributing

Check the [Contributing doc](CONTRIBUTING.md).

## License

[MIT](LICENSE.md)
