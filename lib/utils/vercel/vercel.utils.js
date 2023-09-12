import {
  rmSync, existsSync, mkdirSync, writeFileSync,
} from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';

/**
 * Delete Next.js telemetry files created in build.
 */
function deleteTelemetryFiles() {
  const dirPath = join('.vercel', 'output', 'static', '_next', '__private');

  rmSync(dirPath, { force: true, recursive: true });
}

/**
 * Create vercel config file when needed.
 */
function createVercelProjectConfig() {
  try {
    const projectConfigDir = '.vercel';
    const projectConfigFilePath = `${projectConfigDir}/project.json`;

    if (!existsSync(projectConfigFilePath)) {
      if (!existsSync(projectConfigDir)) {
        mkdirSync(projectConfigDir);
      }

      writeFileSync(projectConfigFilePath, '{"projectId":"_","orgId":"_","settings":{}}');
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Run vercel cli build for production environment.
 */
async function runVercelBuild() {
  // https://vercel.com/docs/build-output-api/v3
  const vercelBuild = spawn('npx', ['--yes', 'vercel@28.16.11', 'build', '--prod']);

  vercelBuild.stdout.on('data', (data) => console.log(data.toString().replace('\n', '')));
  vercelBuild.stderr.on('data', (data) => console.log(data.toString().replace('\n', '')));

  await new Promise((resolve, reject) => {
    vercelBuild.on('close', (code) => {
      if (code === 0) {
        resolve(null);
      } else {
        reject(new Error('Vercel build failed with exit'));
      }
    });
  });
}

export default {
  deleteTelemetryFiles,
  createVercelProjectConfig,
  runVercelBuild,
};
