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
 * @param {boolean} [interactive=false] - Whether to allow user
 * interaction with the running process.
 * @returns {Promise<void>} A promise that resolves when the command completes successfully.
 * @throws Will throw an error if the command exits with a non-zero status code.
 * @example
 * // Executing a command without verbose output
 * await exec('npm install');
 *
 * // Executing a command with verbose output
 * await exec('npm run build', 'Build', true);
 *
 * // Executing an interactive command
 * await exec('npx vue create my-project', 'Vue', false, true);
 */
async function exec(command, scope = 'Process', verbose = false, interactive = false) {
  const stream = new signale.Signale({ interactive: true, scope: ['Process', scope] });

  return new Promise((resolve, reject) => {
    const args = command.split(' ');
    const cmd = args.shift();

    const buildProcess = spawn(cmd, args, {
      shell: true,
      stdio: interactive ? 'inherit' : 'pipe',
    });

    if (!interactive) {
      if (verbose) {
        buildProcess.stdout.on('data', (data) => {
          stream.info(data.toString());
        });

        buildProcess.stderr.on('data', (data) => {
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
    }
  });
}

export default exec;
