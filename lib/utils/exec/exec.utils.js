import { spawn } from 'child_process';
import signale from 'signale';

/**
 * Execute a command asynchronously and retrieve the standard output and standard error.
 * @function
 * @name exec
 * @memberof utils
 * @param {string} command - The command to be executed.
 * @param {string} [scope='Process'] - Log scope. The default is 'Process'.
 * @param {boolean} [verbose=false] - Whether to display the output in real-time.
 * @returns {Promise<void>} A promise that resolves when the command completes successfully.
 * @example
 * // Executing a command without verbose output
 * await exec('npm install');
 *
 * // Executing a command with verbose output
 * await exec('npm run build', 'Build', true);
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
        // Some tools and libraries choose to use stderr for process logging or informational messages.
        const dataStr = data.toString();
        if (dataStr.toLowerCase().includes('error')) {
          stream.error(dataStr);
        } else {
          stream.info(dataStr);
        }
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
