import dotenv from 'dotenv';
import { join } from 'path';
import { fileURLToPath } from 'url';
import fs, { existsSync } from 'fs';

/**
 * This class is a VM context (ENV_VARS_CONTEXT) to handle with environment variables
 * @class EnvVarsContext
 * @description Class to handle with environment variables
 */
class EnvVarsContext {
  #envVars;

  #envFile = '.env';

  #pathDefaultEdge = '.edge';

  constructor() {
    const projectRoot = process.cwd();
    const isWindows = process.platform === 'win32';
    const outputPath = isWindows
      ? fileURLToPath(new URL(`file:///${join(projectRoot, '.')}`))
      : join(projectRoot, '.');
    const envFilePathRoot = join(outputPath, this.#envFile);
    const envFilePathEdge = join(
      outputPath,
      `${this.#pathDefaultEdge}/${this.#envFile}`,
    );

    // Load .env file
    dotenv.config({ path: [envFilePathRoot, envFilePathEdge] });

    this.#cloneEnvRootToEdgeEnv(outputPath);

    this.#envVars = process.env;
  }

  /**
   * Clone .env file to .edge/.env
   * @param {string} outputPath Root path of user project
   * @returns {void} - No return
   */
  #cloneEnvRootToEdgeEnv = async (outputPath) => {
    const envFilePathRoot = join(outputPath, this.#envFile);
    if (!existsSync(envFilePathRoot)) return;
    const envFileBuffer = await fs.promises.readFile(envFilePathRoot);
    const envFilePath = join(
      outputPath,
      `${this.#pathDefaultEdge}/${this.#envFile}`,
    );
    await fs.promises.mkdir(join(outputPath, this.#pathDefaultEdge), {
      recursive: true,
    });
    await fs.promises.writeFile(envFilePath, envFileBuffer);
  };

  /**
   * Azion env vars get method
   * @param {string} key - The environment variable key
   * @returns {string} - The environment variable value
   */
  get(key) {
    return this.#envVars[key];
  }
}

export default new EnvVarsContext();
