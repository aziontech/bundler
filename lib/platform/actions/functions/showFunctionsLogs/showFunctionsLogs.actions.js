import eventsService from '../../../services/events.service.js';

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
    console.log('Waiting for the next request event...');
  }
}

/**
 * Perform real-time tailing of function logs.
 * @param {string} [functionId] - The ID of the function to observe logs for.
 * If not provided, logs from all functions will be shown.
 * @param {boolean} [watch=false] - Whether to observe logs in real time.
 * @returns {void}
 */
async function showFunctionsLogs(functionId, watch = false) {
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
      const { data } = await response.json();

      const consoleLogs = data.cellsConsoleEvents;
      const nextConsoleLog = consoleLogs[0];

      if (!nextConsoleLog) {
        console.log('There are no logs for the current function.');
      }
      if (nextConsoleLog) {
        if (nextConsoleLog?.id !== previousConsoleLogId) {
          if (watch) {
            const event = mountEventLogStructure(nextConsoleLog);
            // eslint-disable-next-line max-len
            const logsGroupedByRequest = consoleLogs.filter((item) => item.id === nextConsoleLog.id);
            logsGroupedByRequest.forEach((log) => {
              event.logs.push(log.line);
            });
            displayLogInBox(event, watch);
            previousConsoleLogId = nextConsoleLog.id;
          }

          if (!watch) {
            const logsGroupedByRequest = Object.values(consoleLogs.reduce((result, event) => {
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

      if (watch) {
        setTimeout(startPoll, 500);
      }
    } catch (error) {
      console.error(error);
    }
  };

  startPoll();
}

export default showFunctionsLogs;
