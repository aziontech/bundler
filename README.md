
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

5. Start developing: Once the project is set up, you can start developing your JavaScript applications or frameworks using the power of Vulcan. Leverage the automated polyfills, Worker creation assistance, and other features provided by Vulcan to enhance your development workflow.

## Using Vulcan

See some examples below:

* Build a JavaScript/Node project (back-end)

   ```shell
   vulcan build
   ```
   
* Build a TypeScript/Node (back-end)

   ```shell
   vulcan build --preset typescript
   ```
   
* Build a Static Next.js project

   ```shell
   vulcan build --preset next --mode deliver
   ```
   
 * Build a Static Astro.js project

   ```shell
   vulcan build --preset astro --mode deliver
   ```
   
* Test your project locally (after build)

   ```shell
   vulcan dev
   ```


## Docs
* [Overview](docs/overview.md)
* [Presets](docs/presets.md)

## Contributing
Check the [Contributing doc](CONTRIBUTING.md).

## Code of Conduct
Check the [Code of Conduct ](CODE_OF_CONDUCT.md).

## License
[MIT](LICENSE.md)
