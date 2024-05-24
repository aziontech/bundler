# Documentation: Presets

Vulcan is an extensible tool that allows you to easily create new presets for frameworks and libraries to run on the Edge. This documentation will describe the fundamental structure and how to add your own preset.

## Presets Structure

To add a new preset, you need to create appropriate folders in the directory: `llb/presets`. The folder representing your framework or library will automatically be included in the predefined listings. Each preset has two modes, represented by folders of the same name: `compute` and `deliver`.

https://github.com/aziontech/vulcan/assets/12740219/d3d6349d-8d6d-481c-b7a2-653a74bccb4d

- Compute: Contains configurations for codes that use computation on the Edge (Front-End SSR or Back-End).
- Deliver: Contains settings for frameworks that only handle requests on Edge to deliver static files (routing but not execution).

Each preset is composed of three main files; `config.js`, `prebuild.js` and `handler.js` and two extra files; `postbuild.js`, to apply automations in the later build phase of the bundlers (before the build process ends), and `azion.config.js` for integration with the deployment in the Azion.

![file-1](https://github.com/aziontech/vulcan/assets/12740219/4ba25280-0463-4ecf-9ad6-f9066444f483)

1.  `config.js`: This file is responsible for extending the Vulcan build (Edge build) and allows the inclusion of polyfills, plugins, Webpack or ESBuild configuration and other needs. By default, you don't need to make any changes.
2.  `prebuild.js`: This file allows you to add the steps for building and adapting the framework. This step is performed before the Vulcan Forging process (which adapts it for Edge). Here you have access to the #utils domain, which provides methods and an interface for you to manipulate the pre-construction of the framework or library.

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

4.  `postbuild.js`: this file is optional. Here you can run actions after the common build done by bundlers.
5.   `azion.config.js`: It is used to deploy and create middleware rules on the Azion platform. Mandatory for use on Azion.

# How to add a new preset

Here's a step-by-step guide on how to add a new preset in Vulcan:

## **Use the command to automatic creation:**

    vulcan presets create

https://github.com/aziontech/vulcan/assets/12740219/f98500a8-7698-4fc6-b074-592ded4c0fa4

### Or do it manually:

## 1. **Create a folder inside `./lib/presets`:**

https://github.com/aziontech/vulcan/assets/12740219/abb1b2cc-5f74-473d-b731-c0b7157cb95e

- The name of this folder should represent the name of your framework or library.
- Inside this folder, you should create another folder named `compute` or `deliver`, depending on the operation mode you want. If the folder is created directly at the root, it will be interpreted as being of the `deliver` type by default.
- **Compute**: This mode should be used when there is effectively a computation being performed at the Edge.

- **Deliver**: This mode should be used when you intend to use the worker only for routing requests and delivering static files that will be computed on the client side.

## 2. **Create the following files in your preset's folder:**

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

 #### Gatsby (deliver) example:
![prebuild](https://github.com/aziontech/vulcan/assets/12740219/d41526b5-768b-4daf-bd75-65865a3f21e0)

## postbuild.js

In this file you can include code to run exactly after the Forging phase (build bundlers with edge settings), that is, this is the last (optional) step of the build.

 #### Next (compute) example:
![postbuild](https://github.com/aziontech/vulcan/assets/12740219/9ae67e6d-3948-423f-9563-f49f456a8e3f)


## azion.config.js

Here you can configure the rules for how the application should behave at the edge (Rules Engine of an Edge Application). You create rules to perform rewrites, define origins, apply caching, and other needs. During the Build process, Vulcan will copy this file to the corresponding project and use it as a source of truth to generate the manifests. This enables the user to create customizations in the project based on the preset rules.

 #### Gatsby (deliver) config:
![azion-config](https://github.com/aziontech/vulcan/assets/12740219/cb511940-08d9-420e-9d89-072db86a3f25)


## 3. **Test your preset:**

After setting up your preset, you can test it using Vulcan's build command. Depending on the mode of your preset, run one of the following commands in your terminal:



https://github.com/aziontech/vulcan/assets/12740219/1e0ad2bf-8fcd-49f7-9242-b1dc0e439742



For `compute` mode:

    vulcan build --preset <name> --mode compute

For `deliver` mode:

    vulcan build --preset <name> --mode deliver

Replace `<name>` with the name of your preset. This will initiate Vulcan's build process for your preset, allowing you to verify its functionality.
