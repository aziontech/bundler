import { feedback } from '#utils';
import { Messages } from '#constants';
/**
 * A comamnd to display logs for a specified function or application.
 * @memberof commands
 * This function allows the user to view logs for a specific function or application.
 * Note that viewing logs for applications is currently unsupported.
 * @param {string} type - The type of entity to show logs for.
 * Accepted values are 'function' and 'application'.
 * @param {string} id - The identifier for the function or application.
 * @param {object} options - Additional options for fetching logs.
 * @param {boolean} options.watch - If true, keep watching the logs and updating in real-time.
 * @returns {Promise<void>} - A promise that resolves when logs are fetched and displayed.
 * @example
 *
 * logsCommand('function', 'functionId123', { watch: true });
 */
async function logsCommand(type, id, { watch }) {
  const { functions } = await import('#platform');

  if (!['function', 'application'].includes(type)) {
    feedback.error(Messages.platform.logs.errors.invalid_log_type);
    return;
  }

  if (type === 'function') {
    functions.actions.showFunctionLogs(id, watch);
  }
  if (type === 'application') {
    feedback.info(Messages.platform.logs.info.unsupported_log_type);
  }
}

export default logsCommand;
