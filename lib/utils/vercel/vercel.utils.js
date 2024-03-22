import { rmSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';

import { Utils } from '#namespaces';

/**
 * @function
 * @memberof Utils
 * @description Delete Next.js telemetry files created in build.
 */
function deleteTelemetryFiles() {
  const dirPath = join('.vercel', 'output', 'static', '_next', '__private');

  rmSync(dirPath, { force: true, recursive: true });
}

/**
 * @function
 * @memberof Utils
 * @description Create vercel config file when needed.
 */
function createVercelProjectConfig() {
  try {
    const projectConfigDir = '.vercel';
    const projectConfigFilePath = `${projectConfigDir}/project.json`;

    if (!existsSync(projectConfigFilePath)) {
      if (!existsSync(projectConfigDir)) {
        mkdirSync(projectConfigDir);
      }

      writeFileSync(
        projectConfigFilePath,
        '{"projectId":"_","orgId":"_","settings":{}}',
      );
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * @function
 * @memberof Utils
 * @description Run vercel cli build for production environment.
 */
async function runVercelBuild() {
  // https://vercel.com/docs/build-output-api/v3
  await new Promise((resolve, reject) => {
    const args = ['npx', '--yes', 'vercel@32.6.1', 'build', '--prod'];
    const cmd = args.shift();

    const execProcess = spawn(cmd, args, {
      shell: true,
      stdio: 'inherit',
    });

    execProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Command '${args.join(' ')}' failed with code ${code}`),
        );
      }
    });

    execProcess.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`Command '${args.join(' ')}' failed with code ${code}`),
        );
      }
    });
  });
}

/**
 * Read vercel config file.
 * @returns {object} Vercel config object.
 */
function loadVercelConfigs() {
  try {
    const fileContent = readFileSync('.vercel/output/config.json', 'utf8');
    const config = JSON.parse(fileContent);

    return config;
  } catch (error) {
    throw new Error(error.message);
  }
}

export default {
  deleteTelemetryFiles,
  createVercelProjectConfig,
  runVercelBuild,
  loadVercelConfigs,
};
