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
    - [`config`](#config)
    - [`presets`](#presets)
    - [`store`](#store)
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

> ⚠️ \*Deprecation Notice:
> Support for the webpack bundler will be discontinued in future releases. While it is still available for now, new features, fixes, and improvements will be focused exclusively on esbuild. We recommend migrating to esbuild as soon as possible to ensure compatibility and better performance in upcoming versions.

### `build`
Builds your project for edge deployment.

```shell
ef build [options]

Options:
  -e, --entry <string>     Code entrypoint (default: ./handler.js or ./handler.ts)
  -p, --preset <type>      Preset of build target (e.g., vue, next, javascript)
  --polyfills              Use node polyfills in build (default: true)
  -w, --worker             Enable worker mode with addEventListener signature (default: false)
  -d, --dev                Build in development mode (default: false)
  -x, --experimental       Enable experimental features (default: false)
```

### `dev`
Starts a local development environment.

```shell
ef dev [entry] [options]

Arguments:
  entry                    Specify the entry file (default: .edge/worker.dev.js)

Options:
  -p, --port <port>        Specify the port (default: "3333")
  -x, --experimental       Enable experimental features (default: false)
```

### `config`
Manages Azion configuration settings with CRUD operations.

```shell
ef config <command> [options]

Commands:
  create              Create a new configuration property
  read                Read configuration properties
  update              Update existing configuration properties
  delete              Delete configuration properties

Options:
  -k, --key <key>     Property key (e.g., build.preset or applications[0].name)
  -v, --value <value> Value to be set (for create/update commands)
  -a, --all           Read or delete entire configuration (for read/delete commands)

Examples:
  $ ef config create -k "build.preset" -v "typescript"
  $ ef config read -k "applications[0].name"
  $ ef config update -k "build.bundler" -v "esbuild"
  $ ef config delete -k "build.polyfills"
  $ ef config read --all
```

### `presets`
Manages presets for Azion projects.

```shell
ef presets <command> [preset]

Commands:
  ls                  List all available presets
  config              Get Azion configuration file for a specific preset

Arguments:
  preset              Preset name (required for config command)

Examples:
  $ ef presets ls
  $ ef presets config react
  $ ef presets config next
```

### `store`
Manages store configuration.

```shell
ef store <command> [options]

Commands:
  init                Initialize store configuration
  destroy             Remove store configuration

Options:
  -c, --config <json> Configuration in JSON format
  -s, --scope <scope> Scope of the store (default: global)
```

### `manifest`
Manages manifest files for Azion.

```shell
ef manifest [action] [options]

Arguments:
  action             Action to perform: "transform" (JSON to JS) or "generate" (config to manifest)
                    (default: "generate")

Options:
  -e, --entry <path>  Path to the input file or configuration file
  -o, --output <path> Output file/directory path

Examples:
  $ ef manifest transform -e manifest.json -o azion.config.js
  $ ef manifest generate -e azion.config.js -o .edge
  $ ef manifest -e azion.config.js -o .edge
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
import { emscripten } from 'azion/presets';

export default defineConfig({
  build: {
    extend: (config) => {
      config.define = {
        ...config.define,
        'global.customFeature': 'JSON.stringify(true)',
        'process.env.CUSTOM_VAR': 'JSON.stringify("value")'
      }
      return config
    },
    preset: {
      ...emscripten,
      prebuild: async (config: AzionConfig, ctx: BuildContext): Promise<AzionPrebuildResult> => {
        // Your custom prebuild logic here
        const result = await doSomething();
        return {
          ...result,
        }
      }
    }
  }
});
```

## Build Process Flow

1. **Config Validation**
   - Validates user configuration using `validateConfig`
   - Ensures configuration schema compliance
   - Early error detection and user feedback

2. **Dependencies Check**
   - Verifies required dependencies are installed
   - Validates build environment requirements

3. **Preset Resolution** (`@modules/preset`)
   - Resolves preset from string name or custom module
   - Loads built-in presets from azion/presets
   - Validates preset interface and metadata

4. **Build Config Setup** (`@modules/config`)
   - Resolves configuration priorities in the following order:
     1. CLI arguments (highest priority)
     2. User config file (`azion.config.js`)
     3. Preset defaults (lowest priority)
   - Sets up bundler configuration
   - Configures build options and extensions

5. **Prebuild Phase** (`@modules/prebuild`)
   - Executes preset's prebuild hooks
   - Prepares build environment and dependencies
   - Framework-specific build preparations

6. **Handler Resolution** (`@modules/handler`)
   - Resolves entry point/handler from CLI args, preset, or user config
   - Validates file existence and accessibility
   - Supports multiple entry points

7. **Worker Setup** (`@modules/worker`)
   - Processes handler files and converts to worker-compatible format
   - Detects handler patterns (ES Modules, Service Worker, Legacy)
   - Generates appropriate wrappers for development/production
   - Creates temporary worker files for bundling

8. **Core Build** (`@modules/core`)
   - Processes bundler configuration (esbuild/webpack)
   - Handles file imports and dependencies
   - Applies polyfills and transformations
   - Generates optimized output

9. **Cleanup**
   - Removes temporary files created during build
   - Cleans up intermediate build artifacts

10. **Postbuild Phase** (`@modules/postbuild`)
    - Executes preset's postbuild hooks
    - Post-processing optimizations
    - Asset finalization

11. **Bindings Setup** (`@modules/bindings`) [Future]
    - Configures Azion platform bindings
    - Sets up edge functions connections
    - *Currently in development*

12. **Storage Setup** (`@modules/storage`) [Future]
    - Configures edge storage connections
    - Sets up data persistence layers
    - *Currently in development*

13. **Environment Setup** (`@modules/environment`)
    - Creates initial `azion.config.js` from preset if none exists
    - Merges configurations (user config takes precedence over preset defaults)
    - Stores build settings locally for development and subsequent builds

14. **Environment Variables**
    - Copies and processes environment variables
    - Sets up runtime environment context

## Documentation

- [Handler Patterns](docs/handler-patterns.md)
- [Node.js APIs](docs/nodejs-apis.md)
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
| Simple Js Firewall Event             | ✅      |
| Nuxt Ssr                             | ✅      |
| Simple Js Network List With Firewall | ✅      |
| Jekyll Static                        | ✅      |
| Simple Js Esm Worker                 | ✅      |
| Simple Js Esm Node                   | ✅      |
| Simple Ts Esm                        | ✅      |
| Simple Js Esm                        | ✅      |

Last test run date: 11/26/25 03:34:14 AM

## Contributing

Check the [Contributing doc](CONTRIBUTING.md).

## License

[MIT](LICENSE.md)
