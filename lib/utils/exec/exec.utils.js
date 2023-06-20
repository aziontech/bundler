import { spawn } from 'child_process';
import feedback from '../feedback/index.js';

/**
 * Execute a command asynchronously and retrieve the standard output and standard error.
 * @param {string} command - The command to be executed.
 * @param {boolean} verbose - Whether to display the output in real-time.
 * @returns {Promise<{ stdout: string, stderr: string }>} A promise that resolves with the
 * standard output and standard error.
 */
async function exec(command, verbose = false) {
  return new Promise((resolve, reject) => {
    const args = command.split(' ');
    const cmd = args.shift();

    const buildProcess = spawn(cmd, args, { shell: true });

    if (verbose) {
      buildProcess.stdout.pipe(process.stdout);
      buildProcess.stderr.pipe(process.stderr);
    }

    let stdout = '';
    let stderr = '';

    buildProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      if (!verbose) feedback.success(data.toString());
    });

    buildProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      if (!verbose) feedback.error(data.toString());
    });

    buildProcess.on('error', (error) => {
      reject(error);
    });

    buildProcess.on('close', (code) => {
      const result = { stdout, stderr };
      if (code === 0) {
        resolve(result);
      } else {
        reject(new Error(`Command '${command}' failed with code ${code}`));
      }
    });
  });
}

export default exec;
