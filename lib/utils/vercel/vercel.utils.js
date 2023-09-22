import { rmSync, existsSync, mkdirSync, writeFileSync } from 'fs';
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
  await new Promise((resolve, reject) => {
    const args = ['npx', '--yes', 'vercel@32.2.1', 'build', '--prod'];
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

export default {
  deleteTelemetryFiles,
  createVercelProjectConfig,
  runVercelBuild,
};
