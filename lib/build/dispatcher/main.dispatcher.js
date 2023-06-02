import { writeFileSync, rmSync } from 'fs';

import { loadBuildContext } from '#utils';
import BuildTools from '#buildTools';

class Dispatcher {
  constructor(target, entry, versionId) {
    this.target = target;
    this.entry = entry;
    this.versionId = versionId;
  }

  run = async () => {
    // Load Context based on target
    console.log('\n\n * Loading prebuild context');
    const {
      entryContent,
      prebuild,
      config,
    } = await loadBuildContext(this.target, this.entry);

    // Run prebuild actions
    await prebuild();

    // create tmp entrypoint
    const tmpEntry = this.entry.replace(/\.(js|ts)\b/g, '.tmp.$1');
    writeFileSync(tmpEntry, entryContent);
    config.custom.entry = tmpEntry;

    let builder;
    switch (config.builder) {
      case 'webpack':
        builder = new BuildTools.WebpackBuilder(config.custom, config.useNodePolyfills);
        break;
      default:
        builder = new BuildTools.WebpackBuilder(config.custom, config.useNodePolyfills);
        break;
    }

    // Run common build
    await builder.run();

    // delete tmp entrypoint
    rmSync(tmpEntry, { force: true });

    console.log('\n* Done!');
  };
}

export default Dispatcher;
