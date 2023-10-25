# Vulcan - Forging The Edge

![vulcan](https://github.com/aziontech/vulcan/assets/12740219/a5043e6f-11cb-4498-a300-5bdb617a9989)

Vulcan is a powerful tool designed to streamline the development and deployment of JavaScript applications and frameworks. This powerful utility automates polyfills for Edge Computing, significantly simplifying the process of creating Workers, particularly for the Azion platform.

One of the key highlights of Vulcan is its ability to establish an intuitive and efficient protocol for facilitating the creation of presets. This makes customization and adaptation to specific project needs even more accessible, providing developers with the necessary flexibility to optimize their applications effectively and efficiently.

## Quick Installation

For those who just want to use Vulcan in their project without contributing to the development, you can install it directly from npm.

```shell
npm install edge-functions
```

or if you prefer yarn:

```shell
yarn add edge-functions
```

## Getting Started for Development

Follow these steps to start using Vulcan:

1. Clone the repository: Clone the Vulcan repository from GitHub to your local machine.

   ```shell
   git clone https://github.com/aziontech/vulcan.git
   ```

2. Installation: Navigate to the cloned Vulcan directory and install the required dependencies.

   ```shell
   cd vulcan
   npm install
   ```

3. Install the Vulcan CLI globally, which allows you to use it as a command-line tool from anywhere in your system.

   ```shell
   npm install -g
   ```

   This command sets up the necessary project structure and configuration files for Vulcan.

4. Start developing: Once the project is set up, you can start developing your JavaScript applications or frameworks using the power of Vulcan. Leverage the automated polyfills, Worker creation assistance, and other features provided by Vulcan to enhance your development workflow.

## Using Vulcan

See some examples below:

- Build a JavaScript/Node project (back-end)

  ```shell
  vulcan build
  ```

- Build a TypeScript/Node (back-end)

  ```shell
  vulcan build --preset typescript
  ```

- Build a Static Next.js project

  ```shell
  vulcan build --preset next --mode deliver
  ```

- Build a Static Astro.js project

  ```shell
  vulcan build --preset astro --mode deliver
  ```

- Test your project locally (after build)

  ```shell
  vulcan dev
  ```

## Vulcan.config.js

The `vulcan.config.js` file offers a robust configuration system for Vulcan. This file is not mandatory but acts as an override mechanism. If you define properties in this file, they will supersede the preset configurations. Properties not defined will rely on the preset.

Here's a detailed breakdown of the configuration properties available in `vulcan.config.js`:

### Entry

**Type:** String

**Description:**  
This represents the primary entry point for your application, where the building process begins.

**Note:** `Entry` will be ignored for jamstack solutions.

### Builder

**Type:** String ('esbuild' or 'webpack')

**Description:**  
Defines which build tool to use. The available options are `esbuild` and `webpack`.

### UseNodePolyfills

**Type:** Boolean

**Description:**  
Determines if Node.js polyfills should be applied. This is useful for projects that leverage Node.js specific functionalities but are targeting environments without such built-in capabilities.

### UseOwnWorker

**Type:** Boolean

**Description:**  
This flag indicates that the constructed code inserts its own worker expression, such as `addEventListener("fetch")` or similar, without the need to inject a provider.

### Preset

**Type:** Object

**Description:**  
Provides preset-specific configurations.

- **Name (Type: String):** Refers to the preset name, e.g., "vue" or "next".
- **Mode (Type: String):** Specifies the mode for the preset, e.g., "compute" or "deliver".

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

For a Vue-based project:

```javascript
module.exports = {
  entry: 'src/index.js',
  builder: 'webpack',
  useNodePolyfills: true,
  useOwnWorker: false,
  preset: {
    name: 'vue',
    mode: 'compute',
  },
  memoryFS: {
    injectionDirs: ['.faststore/@generated/graphql'],
    removePathPrefix: '.faststore/',
  },
  custom: {
    plugins: {},
  },
};
```

**Note:** Adapting `vulcan.config.js` to your setup allows a personalized development experience, catering to the specific needs of your JavaScript applications and frameworks.

## Docs

- [Overview](docs/overview.md)
- [Presets](docs/presets.md)

## Contributing

Check the [Contributing doc](CONTRIBUTING.md).

## Code of Conduct

Check the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE.md)
