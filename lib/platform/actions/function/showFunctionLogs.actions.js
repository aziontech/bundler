import { feedback, debug } from '#utils';
import { Messages } from '#constants';
import eventsService from '../../services/events.service.js';

/**
 *
 * @param {object} log - View logs organized in a box.
 */
function displayLogInBox(log) {
  log.logLines.forEach((line) => {
    try {
      const trimmedLine = line.trim();
      const parsedJSON = JSON.parse(trimmedLine);
      const formattedJSON = JSON.stringify(parsedJSON, null, 2);
      feedback.logs(log.functionId, log.eventId, log.date.toLocaleString()).debug(`\n${formattedJSON}`);
    } catch (error) {
      console.log(error);
      feedback.logs(`Function ID: ${log.functionId}`, log.eventId, log.date.toLocaleString()).debug(`\n${line}`);
    }
  });
}

/**
 * @function
 * @memberof platform
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
  let watchStartTime = new Date();
  let logsToDisplay = {};

  /**
   * Mounts the structure for a console log.
   * @param {object} azionLog - The Azion log event.
   * @param {string} azionLog.id - The ID of the event.
   * @param {string} azionLog.ts - The timestamp of the event.
   * @returns {object} - The log event structure.
   * @property {string} eventId - The ID of the event.
   * @property {string} functionId - The ID of the function.
   * @property {Date} date - The date object of the event.
   * @property {string[]} logLines - The array of log lines.
   */
  function mountEventLogStructure(azionLog) {
    return {
      eventId: azionLog.id,
      functionId: azionLog.functionId,
      date: new Date(azionLog.ts),
      logLines: [],
    };
  }

  try {
    const getLogs = async () => {
      const response = await eventsService.getFunctionsLogs(functionId);

      if (response.status === 200) {
        const responseJSON = await response.json();

        const { cellsConsoleEvents } = responseJSON.data;
        const requestSuccess = !!cellsConsoleEvents;

        if (!requestSuccess) {
          throw new Error(JSON.stringify(responseJSON));
        }

        if (watch) {
          if (watch) {
            feedback.watch(Messages.platform.logs.info.watch_true);
          }
          logsToDisplay = {}; // Clear logsToDisplay on each poll when in watch mode
        }

        cellsConsoleEvents.forEach((event) => {
          const { id, line, ts } = event;
          const eventDate = new Date(ts);

          if (watch && eventDate < watchStartTime) {
            return; // Skip logs that are older than watchStartTime
          }

          if (!logsToDisplay[id]) {
            logsToDisplay[id] = mountEventLogStructure(event);
          }

          logsToDisplay[id].logLines.push(line);
          logsToDisplay[id].date = eventDate;
        });

        Object.values(logsToDisplay).forEach((log) => {
          displayLogInBox(log, watch);
        });

        watchStartTime = new Date();
      }

      if (watch) {
        setTimeout(getLogs, 3000);
      }
    };

    getLogs();
  } catch (error) {
    debug.error(error);
  }
}

process.on('exit', () => {
  feedback.interactive.breakInteractiveChain();
});

export default showFunctionLogs;
