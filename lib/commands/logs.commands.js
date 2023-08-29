import { feedback } from '#utils';
import { Messages } from '#constants';
/**
 *
 * @param type
 * @param id
 * @param options
 * @param options.watch
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
