import { rmSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { exec } from '#utils';
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
 * Run vercel cli build for production environment.
 */
async function runVercelBuild() {
  // https://vercel.com/docs/build-output-api/v3
  await exec('npx --yes vercel@32.2.1 build --prod', '', true, true);
}

export default {
  deleteTelemetryFiles,
  createVercelProjectConfig,
  runVercelBuild,
};
