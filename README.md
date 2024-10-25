# Azion Bundler - Building Applications for Azion Runtime

Azion Bundler is a powerful tool designed to streamline the development and deployment of JavaScript applications and frameworks. This powerful utility automates polyfills for Azion Runtime, significantly simplifying the process of creating Workers.

One of the key highlights of Azion Bundler is its ability to establish an intuitive and efficient protocol for facilitating the creation of presets. This makes customization and adaptation to specific project needs even more accessible, providing developers with the necessary flexibility to optimize their applications effectively and efficiently.

## Supported

E2E tests run daily in the [Vulcan Examples](https://github.com/aziontech/vulcan-examples/tree/main/examples) to ensure that the presets and frameworks continue to work correctly.

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
| Next 13 5 6 Config                   | ⚠️     |
| Next 12 3 4 Config                   | ✅      |
| Next Static                          | ✅      |
| Gatsby Static                        | ✅      |
| Next Node Pages 12 3 1 Fs            | ✅      |
| Vue Vite Static                      | ⚠️     |
| Next 12 Static                       | ✅      |
| Astro Static                         | ✅      |
| Simple Js Env Vars                   | ✅      |
| Eleventy Static                      | ✅      |
| React Static                         | ✅      |
| Angular Static                       | ✅      |
| Simple Js Network List               | ✅      |
| Svelte Static                        | ✅      |
| Vitepress Static                     | ✅      |
| Nuxt Static                          | ✅      |
| Docusaurus Static                    | ✅      |
| Simple Js Firewall Event             | ✅      |
| Simple Js Network List With Firewall | ✅      |
| Jekyll Static                        | ✅      |
| Simple Js Esm Worker                 | ✅      |
| Simple Js Esm Node                   | ✅      |
| Simple Ts Esm                        | ✅      |
| Simple Js Esm                        | ✅      |

Last test run date: 10/25/24 03:40:46 AM
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

4. Start developing: Once the project is set up, you can start developing your JavaScript applications or frameworks using the power of Bundler. Leverage the automated polyfills, Worker creation assistance, and other features provided by Bundler to enhance your development workflow.

## Using Azion Bundler

See some examples below:

- Build a JavaScript/Node project (back-end)

  ```shell
  azbundler build
  ```

- Build a TypeScript/Node (back-end)

  ```shell
  azbundler build --preset typescript
  ```

- Build a Next.js project

  ```shell
  azbundler build --preset next
  ```

- Build Astro.js project

  ```shell
  azbundler build --preset astro
  ```

- Test your project locally (after build)

  ```shell
  azbundler dev
  ```

## Azion.config.js

The `azion.config.js` file offers a robust configuration system for Bundler. This file is not mandatory but acts as an override mechanism. If you define properties in this file, they will supersede the preset configurations. Properties not defined will rely on the preset.

Here's a detailed breakdown of the configuration properties available in `azion.config.js`:

### Entry

**Type:** String

**Description:**
This represents the primary entry point for your application, where the building process begins.

**Note:** `Entry` will be ignored for jamstack solutions.

### Builder

**Type:** String ('esbuild' or 'webpack')

**Description:**
Defines which build tool to use. The available options are `esbuild` and `webpack`.

### Polyfills

**Type:** Boolean

**Description:**
Determines whether Node.js polyfills should be applied. This is useful for projects that leverage specific Node.js functionality but target environments without these built-in features.

### Worker

**Type:** Boolean

**Description:**
This flag indicates that the constructed code inserts its own worker expression, such as `addEventListener("fetch")`.

### Preset

**Type:** Object

**Description:**
Provides preset-specific configurations.

- **Name (Type: String):** Refers to the preset name, e.g., "vue" or "next"..

### MemoryFS

**Type:** Object

**Description:**
Configurations related to the in-memory filesystem.

- **InjectionDirs (Type: Array of Strings):** Directories to be injected into memory for runtime access via the fs API.

- **RemovePathPrefix (Type: String):** A prefix path to be removed from files before injecting into memory.

### Custom

**Type:** Object

**Description:**
Allows you to extend the capabilities of the chosen bundler (either `webpack` or `esbuild`) with custom plugins or configurations.

- **Plugins (Type: Object):** Add your custom plugins for your chosen bundler here.

### Example Configuration

For a Next/Faststore-based project:

```javascript
module.exports = {
  build: {
    entry: 'src/index.js',
    builder: 'webpack',
    polyfills: true,
    worker: false,
    preset: { name: 'next' },
    memoryFS: {
     injectionDirs: ['.faststore/@generated/graphql'],
     removePathPrefix: '.faststore/',
   },
    custom: {
      plugins: {},
    },
  }
};
```

**Note:** Adapting `azion.config.js` to your setup allows a personalized development experience, catering to the specific needs of your JavaScript applications and frameworks.

## Docs

- [Overview](docs/overview.md)
- [Presets](docs/presets.md)
- [Nextjs](docs/nextjs.md)
- [Rust/Wasm example](https://github.com/aziontech/vulcan-examples/tree/main/examples/rust-wasm-yew-ssr/)
- [Emscripten/Wasm example](https://github.com/aziontech/vulcan-examples/tree/main/examples/emscripten-wasm/)
- [Env vars example](https://github.com/aziontech/vulcan-examples/tree/main/examples/javascript/simple-js-env-vars)
- [Storage example](https://github.com/aziontech/vulcan-examples/tree/main/examples/javascript/simple-js-esm-storage)
- [Firewall example](https://github.com/aziontech/vulcan-examples/tree/main/examples/javascript/simple-js-firewall-event)

## Wasm Notes

To use wasm presets you need to install the necessary tools to build your code:

- Emscripten: [emsdk](https://emscripten.org/docs/getting_started/downloads.html);
- Rust/Wasm: [wasm-bindgen-cli](https://crates.io/crates/wasm-bindgen-cli)

## Contributing

Check the [Contributing doc](CONTRIBUTING.md).

## Code of Conduct

Check the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE.md)
