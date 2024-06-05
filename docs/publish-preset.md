# Documentation: Publish Preset

To publish the preset, in addition to building it, you need to follow a few steps:

  1. **Create preset [(instructions here)](https://github.com/aziontech/vulcan/blob/refactor/presets/docs/presets.md#documentation-presets)**.
  2. **Create an example using the preset created in the [Vulcan-Examples](https://github.com/aziontech/vulcan-examples/tree/main/examples) repository (`./examples` submodule).**
  3. **Create e2e tests from the example created in the `tests/e2e` directory.**

      _ℹ️ The e2e test you wrote for the preset will be _automatically run every morning_ and the result will be published [here](https://github.com/aziontech/vulcan?tab=readme-ov-file#supported)._
  
</br>
</br>

 **⚠️  Note: This command is temporary and should be removed soon ⚠️**
 </br></br>
Now to configure the `<init>` command that initializes a template:
</br>

1. Go to [constants/framework-initializer.constants.js](https://github.com/aziontech/vulcan/blob/main/lib/constants/framework-initializer.constants.js) and add your framework object:

    ```console
    MyPreset: {
     options: [
      { value: 'my-preset', message: 'static supported', mode: 'deliver' },
     ],
    },
    ```
    
   - **Options**: accepts multiple boot options.
   - **Value**: is the path to the project folder in [Vulcan Templates](hhttps://github.com/aziontech/vulcan-examples/tree/main/templates).
   - **Message**: Message displayed to the user.
   -  **Mode**: is the `mode` of the preset.
 &nbsp; &nbsp;
#### Run the tests:

```sh
yarn test
```
and 
```sh
yarn test:e2e
```

</br>
</br>
🎉 🎉 Now you're ready to open a pull request 😃
