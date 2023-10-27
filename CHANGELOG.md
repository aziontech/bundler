## [2.0.0-stage.3](https://github.com/aziontech/vulcan/compare/v2.0.0-stage.2...v2.0.0-stage.3) (2023-10-26)


### Bug Fixes

* Add string_decoder in webpack fallback config ([71d376f](https://github.com/aziontech/vulcan/commit/71d376fdb4f2f86d87f5ad389645954ea3b2e88b))
* Add string_decoder in webpack fallback config ([#163](https://github.com/aziontech/vulcan/issues/163)) ([429ab88](https://github.com/aziontech/vulcan/commit/429ab88eab7c007c84f92c0f20c5ae66cc55ac27))

## [2.0.0-stage.2](https://github.com/aziontech/vulcan/compare/v2.0.0-stage.1...v2.0.0-stage.2) (2023-10-26)


### Bug Fixes

* local env hot reload ([#161](https://github.com/aziontech/vulcan/issues/161)) ([e2edb9c](https://github.com/aziontech/vulcan/commit/e2edb9cad2222395850a09f9476eb206b64568f3))
* localenv hot reload ([85f606c](https://github.com/aziontech/vulcan/commit/85f606c7025d1d8474e37bbeecaf46ee9bd7ef3b))

## [2.0.0-stage.1](https://github.com/aziontech/vulcan/compare/v1.7.1...v2.0.0-stage.1) (2023-10-25)


### ⚠ BREAKING CHANGES

* Introduced vulcan.config.js and changing the way to read the entry point of the preset files and the application entrypoint. No longer use the "main()" function as input, but the function that is exported as default "export default foo()".

### Features

* add jsx loader (esbuild) ([93ccf13](https://github.com/aziontech/vulcan/commit/93ccf134159e053814e315ce0e0e4a71ca086b7d))
* Create injectFilesInMem util ([1555c98](https://github.com/aziontech/vulcan/commit/1555c98e1cf0ce40e3c9aca2d14a75af03e89fa3))
* Create node fs polyfill ([cab1095](https://github.com/aziontech/vulcan/commit/cab1095e056e4720c8762a7b27fc6c92e3b4dd03))
* Create node module polyfill ([976a6c3](https://github.com/aziontech/vulcan/commit/976a6c382119c55e3c9f92cd02d0fd74aee863d3))
* Create node process polyfill ([1e61ba2](https://github.com/aziontech/vulcan/commit/1e61ba2d1fb30259b47c72e825dab5a72478d532))
* enable useOwnWorker for custom provider ([8a88ff7](https://github.com/aziontech/vulcan/commit/8a88ff7efd0bc5afc43f0fe6666da3831ae702c0))
* esbuild windows support ([d10e467](https://github.com/aziontech/vulcan/commit/d10e4678154e87ad33b5de9f76680f1a6815edcc))
* Handle content to inject in worker ([3356743](https://github.com/aziontech/vulcan/commit/33567432832ebb60e07bd4a1098ff62ef1e2f09c))
* Handle mem fs injection in dispatcher ([3e89438](https://github.com/aziontech/vulcan/commit/3e89438528b8ebbbecc8366af5776c282d8a764e))
* In Memory File System ([#154](https://github.com/aziontech/vulcan/issues/154)) ([5a1a4fc](https://github.com/aziontech/vulcan/commit/5a1a4fc2f8c971fe57cb96888310910eef350102))
* new vulcan.config and entry reading pattern ([62dbcae](https://github.com/aziontech/vulcan/commit/62dbcae283df8440daa91238ec577060662be3bf))
* read vulcan.env for build preconfig ([b6a7b7c](https://github.com/aziontech/vulcan/commit/b6a7b7c8733a59513f624ba8dd68d424c7a66616))
* Use fs, module and process polyfills in next compute build ([7de9a56](https://github.com/aziontech/vulcan/commit/7de9a56e7cdda8cf584697ec02457f602e2dad68))
* vulcan.config.js ([ee7b0c0](https://github.com/aziontech/vulcan/commit/ee7b0c038a9623adec6b44e528ff3c8269e07cc9))
* vulcan.config.js ([#153](https://github.com/aziontech/vulcan/issues/153)) ([f7d0118](https://github.com/aziontech/vulcan/commit/f7d01183d961aac5a50f4739db2504e1dd3c452d))


### Bug Fixes

* Create vulcan global object ([04e2c4e](https://github.com/aziontech/vulcan/commit/04e2c4eaf0ddae261069c04212f9aef333516cbf))
* fetch in local environment ([86ec3f5](https://github.com/aziontech/vulcan/commit/86ec3f536c30be13591074a97ca33058004c4c35))
* fix some tests ([ed603a9](https://github.com/aziontech/vulcan/commit/ed603a9be4931d2e7b10fc3c2dab036a84113097))
* getPackageManager command ([391d565](https://github.com/aziontech/vulcan/commit/391d565c289527e911bc47c8f9a45b33d2a2c88f))
* rebuild yarn.lock ([7d60749](https://github.com/aziontech/vulcan/commit/7d60749627d931e31528ab903588a5c88b058a20))
* relative package manager (npm) ([605d6e6](https://github.com/aziontech/vulcan/commit/605d6e6280496707d32df5df08745076e490b4cb))
* remove dependency cycle in vercel util ([a0cc528](https://github.com/aziontech/vulcan/commit/a0cc5286665258b87fd9125ef3a082c9cd25d7ff))
* Remove duplicated imports of typedefs (jsdocs) ([58054d0](https://github.com/aziontech/vulcan/commit/58054d011203d2c54a0961a25d1fbfe1621d5597))
* Remove duplicated imports of typedefs (jsdocs) ([#138](https://github.com/aziontech/vulcan/issues/138)) ([03d6be9](https://github.com/aziontech/vulcan/commit/03d6be99835657032844f74dd95c435b58ce9468))
* Remove duplicated to string in injectFilesInMem util ([1a9bc0f](https://github.com/aziontech/vulcan/commit/1a9bc0fff99fa9ecdaa1a1f69be871674a9e49d6))
* Set correct command in hexo prebuild ([fd62874](https://github.com/aziontech/vulcan/commit/fd628748c0432056f166075a607db588ed748125))
* Set correct command in hexo prebuild ([#158](https://github.com/aziontech/vulcan/issues/158)) ([5cb729c](https://github.com/aziontech/vulcan/commit/5cb729ca477a53018b23a4bfb40766099a126240))
* Set correct log in get asset from storage method ([1e9c63a](https://github.com/aziontech/vulcan/commit/1e9c63ae6a2f4af3359ed9b610d9c692891577a6))
* validate installed dependencies only if they exists ([c2789e5](https://github.com/aziontech/vulcan/commit/c2789e5e7b2be855a328d4a24d02da22d7874a2c))
* validate installed dependencies only if they exists ([850dbd1](https://github.com/aziontech/vulcan/commit/850dbd1512efb4658eac5ccab42fdd0b1f96b73f))
* validate installed dependencies only if they exists ([#134](https://github.com/aziontech/vulcan/issues/134)) ([51474ab](https://github.com/aziontech/vulcan/commit/51474aba9f97a3beaef58d7a9bc7e26a9d19ca69))

### [1.7.1](https://github.com/aziontech/vulcan/compare/v1.7.0...v1.7.1) (2023-10-10)


### Bug Fixes

* adding the stage url ([18463ec](https://github.com/aziontech/vulcan/commit/18463ec530e7555e4e979d79ba1fdf70290cc81f))
* removing utf8 when reading file ([579c975](https://github.com/aziontech/vulcan/commit/579c975a8dc2e6e8b0596c9c228a346a98fed37d))
* removing utf8 when reading file ([#146](https://github.com/aziontech/vulcan/issues/146)) ([bd99219](https://github.com/aziontech/vulcan/commit/bd99219fefad5f718f9c6add32bb372063814ff9))

### [1.7.1-stage.1](https://github.com/aziontech/vulcan/compare/v1.7.0...v1.7.1-stage.1) (2023-10-10)


### Bug Fixes

* adding the stage url ([18463ec](https://github.com/aziontech/vulcan/commit/18463ec530e7555e4e979d79ba1fdf70290cc81f))
* removing utf8 when reading file ([579c975](https://github.com/aziontech/vulcan/commit/579c975a8dc2e6e8b0596c9c228a346a98fed37d))
* removing utf8 when reading file ([#146](https://github.com/aziontech/vulcan/issues/146)) ([bd99219](https://github.com/aziontech/vulcan/commit/bd99219fefad5f718f9c6add32bb372063814ff9))

## [1.7.0](https://github.com/aziontech/vulcan/compare/v1.6.5...v1.7.0) (2023-09-14)


### Features

* add custom server with js files ([#97](https://github.com/aziontech/vulcan/issues/97)) ([f73a31e](https://github.com/aziontech/vulcan/commit/f73a31e19e23c773e379f3cd193262468cf1ba52))
* Add list preset modes ([4d1b924](https://github.com/aziontech/vulcan/commit/4d1b924f1c3d403683dcd1d0a2245cf9d68cd3a3))
* Add next webpack polyfills ([#98](https://github.com/aziontech/vulcan/issues/98)) ([5451fa5](https://github.com/aziontech/vulcan/commit/5451fa59c69f4bc148649e2f0b67e7b15012f678))
* Add Next.js support ([#125](https://github.com/aziontech/vulcan/issues/125)) ([a53c807](https://github.com/aziontech/vulcan/commit/a53c80727673ff209842372eb467d01595f3d15d))
* added handler and code compile ([#100](https://github.com/aziontech/vulcan/issues/100)) ([2e245fd](https://github.com/aziontech/vulcan/commit/2e245fdf67f5fdb746072950b6e64b14d9273d19))
* check if dependencies are installed and log vercel cli ([144bc7a](https://github.com/aziontech/vulcan/commit/144bc7ac02b626fa9c1693ebd9a2f39a17244473))
* Improve vercel build logs ([67ad3bd](https://github.com/aziontech/vulcan/commit/67ad3bd8f918c23d09514ce7acac77a5ac519db5))
* list presets modes ([df1d71e](https://github.com/aziontech/vulcan/commit/df1d71e43041224a47653e0c9853e18205f92c51))
* pre build configuration and custom static file server Next ([#96](https://github.com/aziontech/vulcan/issues/96)) ([1d2ab58](https://github.com/aziontech/vulcan/commit/1d2ab58370432b81cfa625a0d9a1c32eaa27cb93))


### Bug Fixes

* Add unused files in npm ignore ([ea3acf8](https://github.com/aziontech/vulcan/commit/ea3acf8a536fbe26f0e3e5b359385607930e79ec))
* change exit code from 0 to 1 in catch ([835bc89](https://github.com/aziontech/vulcan/commit/835bc8920e9228835e87020e8d98b3ba9c366208))
* Create .npmignore ([#131](https://github.com/aziontech/vulcan/issues/131)) ([90383b0](https://github.com/aziontech/vulcan/commit/90383b01cd0dea848840d3348bf30cdcfdd79388))
* custom server code and config file ([#103](https://github.com/aziontech/vulcan/issues/103)) ([340dd11](https://github.com/aziontech/vulcan/commit/340dd11acf0fb5e89e84d83404e0659ffd3f5b42))
* Next build fix and improvements ([#101](https://github.com/aziontech/vulcan/issues/101)) ([f9100c5](https://github.com/aziontech/vulcan/commit/f9100c5177abae307985257afe471f3538762161))
* remove local run command message ([2d527b3](https://github.com/aziontech/vulcan/commit/2d527b3bb1b4abe383ce4ca969d70a9f5513c1c9))
* remove unnecessary Error ([3fdf2d9](https://github.com/aziontech/vulcan/commit/3fdf2d9fa3c4e477296019160d0681e5d7e5408a))
* response cache and improvements ([#102](https://github.com/aziontech/vulcan/issues/102)) ([ee2da8a](https://github.com/aziontech/vulcan/commit/ee2da8a9ec5ade1b509dfbaf87a01ae8946d6342))

## [1.7.0-stage.2](https://github.com/aziontech/vulcan/compare/v1.7.0-stage.1...v1.7.0-stage.2) (2023-09-14)

### Bug Fixes

- Add unused files in npm ignore ([ea3acf8](https://github.com/aziontech/vulcan/commit/ea3acf8a536fbe26f0e3e5b359385607930e79ec))
- Create .npmignore ([#131](https://github.com/aziontech/vulcan/issues/131)) ([90383b0](https://github.com/aziontech/vulcan/commit/90383b01cd0dea848840d3348bf30cdcfdd79388))

## [1.7.0-stage.1](https://github.com/aziontech/vulcan/compare/v1.6.4-stage.2...v1.7.0-stage.1) (2023-09-14)

### Features

- add custom server with js files ([#97](https://github.com/aziontech/vulcan/issues/97)) ([f73a31e](https://github.com/aziontech/vulcan/commit/f73a31e19e23c773e379f3cd193262468cf1ba52))
- Add list preset modes ([4d1b924](https://github.com/aziontech/vulcan/commit/4d1b924f1c3d403683dcd1d0a2245cf9d68cd3a3))
- Add next webpack polyfills ([#98](https://github.com/aziontech/vulcan/issues/98)) ([5451fa5](https://github.com/aziontech/vulcan/commit/5451fa59c69f4bc148649e2f0b67e7b15012f678))
- Add Next.js support ([#125](https://github.com/aziontech/vulcan/issues/125)) ([a53c807](https://github.com/aziontech/vulcan/commit/a53c80727673ff209842372eb467d01595f3d15d))
- added handler and code compile ([#100](https://github.com/aziontech/vulcan/issues/100)) ([2e245fd](https://github.com/aziontech/vulcan/commit/2e245fdf67f5fdb746072950b6e64b14d9273d19))
- check if dependencies are installed and log vercel cli ([144bc7a](https://github.com/aziontech/vulcan/commit/144bc7ac02b626fa9c1693ebd9a2f39a17244473))
- Improve vercel build logs ([67ad3bd](https://github.com/aziontech/vulcan/commit/67ad3bd8f918c23d09514ce7acac77a5ac519db5))
- list presets modes ([df1d71e](https://github.com/aziontech/vulcan/commit/df1d71e43041224a47653e0c9853e18205f92c51))
- pre build configuration and custom static file server Next ([#96](https://github.com/aziontech/vulcan/issues/96)) ([1d2ab58](https://github.com/aziontech/vulcan/commit/1d2ab58370432b81cfa625a0d9a1c32eaa27cb93))

### [1.6.5](https://github.com/aziontech/vulcan/compare/v1.6.4...v1.6.5) (2023-09-14)

### Bug Fixes

- Add npm semantic release plugin in plugins list ([703a8ea](https://github.com/aziontech/vulcan/commit/703a8ea0f04f8d1de4489a8dd9f3523566334a4a))
- Add write permissions in release workflow ([39c1cae](https://github.com/aziontech/vulcan/commit/39c1cae20cc5371a1a7ba49d4754474ee61735d0))
- permissions in release workflow ([#126](https://github.com/aziontech/vulcan/issues/126)) ([37ebee6](https://github.com/aziontech/vulcan/commit/37ebee608564de0d8903f9b09788c3aaffcd2315))
- Remove skip ci option in git plugin ([d954fdc](https://github.com/aziontech/vulcan/commit/d954fdc76944c954662e3828054f5b06c854e865))
- semantic release plugins config ([f7c30a2](https://github.com/aziontech/vulcan/commit/f7c30a26dd7eb0051bf9306be66cbcb78253286a))
- semantic release plugins config ([#124](https://github.com/aziontech/vulcan/issues/124)) ([89289e0](https://github.com/aziontech/vulcan/commit/89289e066b01880f566d396a2214c528e6db93a3))
- set correct options in plugins section ([3a0c8f2](https://github.com/aziontech/vulcan/commit/3a0c8f2cf4c70fc70da0c19e6c5172a4bb8aef0a))

### [1.6.4-stage.2](https://github.com/aziontech/vulcan/compare/v1.6.4-stage.1...v1.6.4-stage.2) (2023-09-14)

### Bug Fixes

- Add npm semantic release plugin in plugins list ([703a8ea](https://github.com/aziontech/vulcan/commit/703a8ea0f04f8d1de4489a8dd9f3523566334a4a))
- Add write permissions in release workflow ([39c1cae](https://github.com/aziontech/vulcan/commit/39c1cae20cc5371a1a7ba49d4754474ee61735d0))
- permissions in release workflow ([#126](https://github.com/aziontech/vulcan/issues/126)) ([37ebee6](https://github.com/aziontech/vulcan/commit/37ebee608564de0d8903f9b09788c3aaffcd2315))
- Remove skip ci option in git plugin ([d954fdc](https://github.com/aziontech/vulcan/commit/d954fdc76944c954662e3828054f5b06c854e865))
- semantic release plugins config ([f7c30a2](https://github.com/aziontech/vulcan/commit/f7c30a26dd7eb0051bf9306be66cbcb78253286a))
- semantic release plugins config ([#124](https://github.com/aziontech/vulcan/issues/124)) ([89289e0](https://github.com/aziontech/vulcan/commit/89289e066b01880f566d396a2214c528e6db93a3))
- set correct options in plugins section ([3a0c8f2](https://github.com/aziontech/vulcan/commit/3a0c8f2cf4c70fc70da0c19e6c5172a4bb8aef0a))
