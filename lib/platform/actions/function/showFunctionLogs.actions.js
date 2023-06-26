import { feedback, debug } from '#utils';
import { Messages } from '#constants';
import eventsService from '../../services/events.service.js';

/**
 *
 * @param {object} log - View logs organized in a box.
 * @param {boolean} [watch=false] - Whether to observe logs in real time.
 */
function displayLogInBox(log, watch = false) {
  const functionIdLabel = 'Function ID:';
  const dateLabel = 'Date:';
  const eventIdLabel = 'Event ID:';
  const functionIdLine = `${functionIdLabel} ${log.functionId}`;
  const dateLine = `${dateLabel} ${log.date}`;
  const eventIdLine = `${eventIdLabel} ${log.eventId}`;
  const maxLength = Math.max(
    functionIdLine.length,
    dateLine.length,
    eventIdLine.length,
    ...log.logs.map((line) => line.length),
  );
  const horizontalLine = '═'.repeat(maxLength + 2);

  console.log(`╔${horizontalLine}╗`);
  console.log(`║ ${functionIdLine.padEnd(maxLength)} ║`);
  console.log(`║ ${eventIdLine.padEnd(maxLength)} ║`);
  console.log(`║ ${dateLine.padEnd(maxLength)} ║`);
  console.log(`╠${horizontalLine}╣`);
  log.logs.forEach((line) => {
    console.log(`║ ${line.padEnd(maxLength)} ║`);
  });
  console.log(`╚${horizontalLine}╝`);

  if (watch) {
    console.log(Messages.platform.logs.info.watch_true);
  }
}

/**
 * @function
 * @memberof Platform
 * @name showFunctionLogs
 * @description This function retrieves and displays the logs of a specific function
 * or all functions from the edge application. If the watch parameter is set to true,
 * it continuously polls and updates the function logs in real time.
 * @param {string} [functionId] - Optional. The ID of the function for which to retrieve the logs.
 *  If not provided, the logs from all functions are retrieved.
 * @param {boolean} [watch=false] - Optional. If set to true, the function logs are observed
 *  and updated in real time. Default is false.
 * @returns {void} This function does not return anything. It retrieves and logs the function
 * logs to the console.
 * @throws {Error} If an error occurs while retrieving the logs, it is caught
 * and logged to the console.
 * @example
 * // To observe logs for a specific function in real time:
 * showFunctionLogs('myFunctionId', true);
 *
 * // To get logs from all functions:
 * showFunctionLogs();
 */
async function showFunctionLogs(functionId, watch = false) {
  let previousConsoleLogId = null;

  /**
   * Mounts the structure for a console log.
   * @param {object} azionLog - The Azion log event.
   * @param {string} azionLog.id - The ID of the  event.
   * @param {string} azionLog.ts - The timestamp of the event.
   * @returns {object} - The log event structure.
   * @property {string} eventId - The ID of the event.
   * @property {string} date - The formatted date of the event.
   * @property {string[]} logs - The array of log messages.
   */
  const mountEventLogStructure = (azionLog) => ({
    eventId: azionLog.id,
    functionId: azionLog.functionId,
    date: new Date(azionLog.ts).toLocaleString(),
    logs: [],
  });

  /**
   * Internal function for performing polling and retrieving function logs.
   * @returns {void}
   */
  const startPoll = async () => {
    try {
      const response = await eventsService.getFunctionsLogs(functionId);
      const responseJSON = await response.json();
      const { cellsConsoleEvents } = responseJSON.data;
      const requestSuccess = !!cellsConsoleEvents;

      if (!requestSuccess) {
        throw new Error(JSON.stringify(responseJSON));
      }
      if (requestSuccess) {
        const nextConsoleLog = cellsConsoleEvents.length > 0 ? cellsConsoleEvents[0] : null;

        if (!nextConsoleLog) {
          feedback.info(Messages.platform.logs.info.no_logs);
        }
        if (nextConsoleLog) {
          if (nextConsoleLog?.id !== previousConsoleLogId) {
            if (watch) {
              const event = mountEventLogStructure(nextConsoleLog);
              // eslint-disable-next-line max-len
              const logsGroupedByRequest = cellsConsoleEvents.filter((item) => item.id === nextConsoleLog.id);
              logsGroupedByRequest.forEach((log) => {
                event.logs.push(log.line);
              });
              displayLogInBox(event, watch);
              previousConsoleLogId = nextConsoleLog.id;
            }

            if (!watch) {
              const logsGroupedByRequest = Object.values(cellsConsoleEvents
                .reduce((result, event) => {
                  const { id, line } = event;

                  if (!result[id]) {
                  // eslint-disable-next-line no-param-reassign
                    result[id] = mountEventLogStructure(event);
                  }

                  result[id].logs.push(line);

                  return result;
                }, {}));

              logsGroupedByRequest.forEach((log) => {
                displayLogInBox(log, watch);
              });
            }
          }
        }
      }

      if (watch) {
        setTimeout(startPoll, 500);
      }
    } catch (error) {
      debug.error(error);
    }
  };

  startPoll();
}

export default showFunctionLogs;
