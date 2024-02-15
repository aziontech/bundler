import dotenv from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';

/**
 * This class is a VM context (ENV_VARS_CONTEXT) to handle with environment variables
 * @class EnvVarsContext
 * @description Class to handle with environment variables
 */
class EnvVarsContext {
  #envVars;

  constructor() {
    const projectRoot = process.cwd();
    const isWindows = process.platform === 'win32';
    const outputPath = isWindows
      ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`))
      : join(projectRoot, '.edge');
    const envFilePath = join(outputPath, '.env');
    dotenv.config({ path: envFilePath, override: true });
    this.#envVars = process.env;
  }

  /**
   * Azion env vars get method
   * @param {string} key - The environment variable key
   * @returns {string} - The environment variable value
   */
  get(key) {
    return this.#envVars[key];
  }
}

export default EnvVarsContext;
