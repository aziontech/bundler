import { spawn } from 'child_process';
import signale from 'signale';

/**
 * Execute a command asynchronously and retrieve the standard output and standard error.
 * @param {string} command - The command to be executed.splay the output in real-time.
 *  @param {string} [scope='Process'] - Signale log scope.
 *  @param {boolean} [verbose=false] - Whether to display the output in real-time.
 * @returns {Promise<void>} A promise that resolves when the command completes successfully.
 */
async function exec(command, scope = 'Process', verbose = false) {
  const stream = new signale.Signale({ interactive: true, scope: ['Process', scope] });

  return new Promise((resolve, reject) => {
    const args = command.split(' ');
    const cmd = args.shift();

    const buildProcess = spawn(cmd, args, { shell: true });

    if (verbose) {
      buildProcess.stdout.on('data', (data) => {
        stream.info(data.toString());
      });

      buildProcess.stderr.on('data', (data) => {
        stream.error(data.toString());
      });
    }

    buildProcess.on('error', (error) => {
      reject(error);
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command '${command}' failed with code ${code}`));
      }
    });
  });
}
export default exec;
