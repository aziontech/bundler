# Documentation: Presets

Vulcan is an extensible platform that allows you to easily create new presets for frameworks and libraries to run on the Edge. This documentation will describe the fundamental structure and how to add your own preset.

## Presets Structure

To add a new preset, you need to create appropriate folders in two directories: `presets/default` or `presets/custom`. The folder representing your framework or library will automatically be included in the preset listings. Each preset has two modes, represented by folders of the same name: `compute` and `deliver`.

https://github.com/aziontech/vulcan/assets/12740219/84c7d7a1-4167-4e7e-993f-41a6eb653758

- Compute: This holds configurations for frameworks that use computation on the Edge (Front-End SSR or Back-End).
- Deliver: This holds configurations for frameworks that merely handle requests on the Edge to deliver static files (routing, but not execute).

Each preset is made up of three primary files: `config.js`, `prebuild.js`, and `handler.js`.

![file-1](https://github.com/aziontech/vulcan/assets/12740219/4ba25280-0463-4ecf-9ad6-f9066444f483)

1.  `config.js`: This file is responsible for extending the Vulcan build (Edge build) and allows the inclusion of polyfills, plugins, and other necessities. By default, you don't need to make alterations.
2.  `prebuild.js`: This file allows you to add the build and adaptation stages of the framework. This stage is executed before Vulcan's Forging process (which adapts it for the Edge). Here, you have access to the `#utils` domain, which provides methods and an interface for you to manipulate the build of the framework or library.

    Commonly used methods include:

    - `exec`: An abstraction for `child_process:spawn`. You send the command, the scope (which will be shown in the log, default is 'process'), and the verbose flag to display or not the resultant logs.

    - `getPackageManager`: This method returns the package manager relative to the user's project (can be yarn, npm, or pnpm).

    - `copyDirectory`: This function is used to copy the resulting static files from the framework build to the local Edge environment (.edge/storage).

    - `feedback`: This interface is used to display messages during the process, if necessary, or in case of error.

3.  `handler.js`: This function is executed on the Edge. During the Forging stage, it is inserted within the provider's worker (presets/providers). Here, you have access to edgehooks (import from #edge), which are ready-made snippets of code to add to your handler.

    Current edgehooks include:

    - mountSPA: This function takes the request and sets up the routing for a standard SPA, ready to redirect requests to index.html and also route the static files.

    - mountSSG: This function takes the request and sets up routes according to the SSG structure.
    - ErrorHTML: This edgehook provides a return of an HTML template showing the error and the description passed as a parameter. You can pass the captured error as the third parameter, and it will be displayed on the screen (it's a good way to debug).

# How to add a new preset

Here's a step-by-step guide on how to add a new preset in Vulcan:

## **Use the command to automatic creation:**

    vulcan presets create

https://github.com/aziontech/vulcan/assets/12740219/9ca7371e-713a-4b29-a99b-c1a18d28bc67

### Or do it manually:

## 1. **Create a folder inside `./lib/presets/custom`:**

https://github.com/aziontech/vulcan/assets/12740219/abb1b2cc-5f74-473d-b731-c0b7157cb95e

- The name of this folder should represent the name of your framework or library.
- Inside this folder, you should create another folder named `compute` or `deliver`, depending on the operation mode you want. If the folder is created directly at the root, it will be interpreted as being of the `deliver` type by default.
- **Compute**: This mode should be used when there is effectively a computation being performed at the Edge.

- **Deliver**: This mode should be used when you intend to use the worker only for routing requests and delivering static files that will be computed on the client side.

2.  ## **Create the following files in your preset's folder:**

    ## handler.js

    This file contains the code that is executed within the worker in the edge function. Essentially, it is the code that runs directly on the edge. In the context of the `deliver` mode, this may simply act as a router. However, in cases where computation is needed, it can be designed to perform more complex tasks. Remember, the capabilities of your handler.js are dependent on your use case and the mode of operation you've chosen for your preset.

    #### For the cases involving static (deliver) frameworks, here's what you can do:

    - For Single Page Application (SPA) types:
      Consider copying the preset handler similar to Vue. This utilizes the `mountSPA` hook which sets up the routing for your SPA effectively.
    - For Static Site Generator (SSG) projects:
      If you have a project that generates multiple HTML files, take a look at how the Next.js project handles this. They use the `mountSSG` hook, which sets up static routing for all the generated HTML pages.

    **Note**: Remember, these are just examples and can serve as a starting point for your own custom preset. Adjust and extend them as necessary to fit your project's specific needs.

    ## config.js

    This file serves as an extension to the edge build. It enables the inclusion of polyfills, plugins, or any other procedures that relate to the build process executed on the edge. Although it is editable, we strongly advise against making changes to this file unless absolutely necessary. It's designed to ensure optimal operation, and modifications should be undertaken with careful consideration.

    ## prebuild.js

    In this file, you should adapt the native build process of your framework or library. Usually, in the case of _deliver_ presets, this file will be used to ensure that the generated static artifacts are placed in the _.edge/storage/_ directory.

    #### React (deliver) Example:

![prebuild](https://github.com/aziontech/vulcan/assets/12740219/85adc374-220b-4003-8c3e-6ec5b06a483f)

**Note**: The use of `compute` type presets is still under development and does not have many examples available. We currently support build/import resolution for pure JavaScript code (or with polyfills), as shown in the `./examples/simple-js-esm` example.

3.  ## **Test your preset:**
    After setting up your preset, you can test it using Vulcan's build command. Depending on the mode of your preset, run one of the following commands in your terminal:

https://github.com/aziontech/vulcan/assets/12740219/7033d37a-30ee-4098-8fe5-bbfca536591d

For `compute` mode:

    vulcan build --preset <name> --mode compute

For `deliver` mode:

    vulcan build --preset <name> --mode deliver

Replace `<name>` with the name of your preset. This will initiate Vulcan's build process for your preset, allowing you to verify its functionality.
