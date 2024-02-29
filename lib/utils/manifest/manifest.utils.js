import { join, dirname } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

/**
 * @typedef {object} Route
 * @property {string} from - The path of the received request. Accepts regex.
 * @property {string} to - Where it should point to (function or static).
 * @property {number} priority - The priority of rule creation.
 * @property {string} type - compute or deliver route.
 */

/**
 * @class
 * @description A class to manage a manifest object. The manifest object contains routes and a filesystem array.
 * The routes are divided into two types (arrays): 'compute' and 'deliver'.
 * 'compute' is used for routes that point to a function to be executed.
 * 'deliver' is used for routes that point directly to a static resource.
 */
class Manifest {
  constructor() {
    this.manifestPath = join(process.cwd(), '.edge/manifest.json');
    this.manifest = {
      routes: /** @type {Route} */ ([]),
      fs: [],
    };
  }

  // eslint-disable-next-line class-methods-use-this
  #validateRoute(route) {
    if (!route || typeof route !== 'object') {
      throw new Error('Route must be an object.');
    }

    if (!route.from || typeof route.from !== 'string') {
      throw new Error('Route.from must be a string.');
    }

    if (!route.to || typeof route.to !== 'string') {
      throw new Error('Route.to must be a string.');
    }

    if (!route.priority || typeof route.priority !== 'number') {
      throw new Error('Route.priority must be a number.');
    }

    const validTypes = ['deliver', 'compute'];
    const invalidType = !validTypes.includes(route.type);
    if (!route.type || typeof route.type !== 'string' || invalidType) {
      throw new Error('Invalid mode. Must be "compute" or "deliver".');
    }
  }

  /**
   * @function
   * @description Adds a route to the manifest object.
   * @param {Route} route - The route object to be added to the manifest. This object contains the 'from' and 'to' paths and the priority of the route.
   */
  setRoute(route) {
    this.#validateRoute(route);
    this.manifest.routes.push(route);
  }

  /**
   * @function
   * @description Adds a file to the manifest object. This file will be loaded into runtime memory to simulate a filesystem (fs). The named variable will be used to access this file in memory.
   * @param {string} variableName - The name of the variable to be used in runtime memory. This variable will be used to access the file.
   * @param {string} filePath - The path of the file that will be loaded into memory.
   */
  setFile(variableName, filePath) {
    // Validate variable name with JavaScript variable naming rules
    if (
      !/^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/.test(variableName)
    ) {
      throw new Error('Invalid variable name.');
    }
    const randomNumber = Math.floor(Math.random() * 1000000);

    // Append the random number to the variable name
    const uniqueVariableName = `${variableName}_${randomNumber}`;

    // Validate file path
    if (typeof filePath !== 'string') {
      throw new Error('File path must be a string.');
    }

    // Add file to the manifest
    this.manifest.fs.push({ [uniqueVariableName]: filePath });
  }

  /**
   * @function
   * @description Validates manifest to be generated.
   */
  validateManifest() {
    // validate duplicated priorities in routes
    const numberOfRoutes = this.manifest.routes.length;
    const priorities = this.manifest.routes.map((route) => route.priority);
    const prioritiesSize = [...new Set(priorities)].length;
    if (numberOfRoutes !== prioritiesSize) {
      throw new Error(
        'Invalid Manifest file! Duplicated priorities in routes.',
      );
    }
  }

  /**
   * @function
   * @description Write the manifest file from the current state of the manifest object.
   */
  generate() {
    this.validateManifest();

    mkdirSync(dirname(this.manifestPath), { recursive: true });
    writeFileSync(
      this.manifestPath,
      JSON.stringify(this.manifest, null, 2),
      'utf8',
    );
    // clear manifest to reload server
    this.manifest = {
      routes: [],
      fs: [],
    };
  }
}

export default new Manifest();
