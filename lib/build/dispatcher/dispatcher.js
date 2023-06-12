import { writeFileSync, rmSync } from 'fs';

import { loadBuildContext } from '#utils';
import { Webpack } from '#bundlers';

/**
 * Class representing a Dispatcher for build operations.
 * @example
 * const dispatcher = new Dispatcher('dist', 'main.js', 'v1');
 * dispatcher.run();
 */
class Dispatcher {
  /**
   * Create a Dispatcher.
   * @param {string} target - The target for the build.
   * @param {string} entry - The entry point for the build.
   * @param {string} versionId - The version ID for the build.
   */
  constructor(target, entry, versionId) {
    this.target = target;
    this.entry = entry;
    this.versionId = versionId;
  }

  /**
   * Run the build process.
   */
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
        builder = new Webpack(config.custom, config.useNodePolyfills);
        break;
      default:
        builder = new Webpack(config.custom, config.useNodePolyfills);
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
