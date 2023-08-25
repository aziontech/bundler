import { AzionEdges, Messages } from '#constants';
import { feedback, debug, exec } from '#utils';

const isWindows = process.platform === 'win32';

/**
 * @function
 * @memberof platform
 * @name watchPropagation
 * @description Monitors the propagation of a domain across the edge networks after the FIRST
 * deployment. This function fetches the specified domain at regular intervals to check for
 *  propagation status. It interprets a 404 response as indicating that the domain is still
 *  propagating. Any other response is taken to mean that the domain has successfully
 * propagated to the edge networks and is ready for access.
 * @param {string} domain - The domain to monitor for propagation across the edge networks.
 * @throws Will throw an error if there is a failure during the monitoring process.
 * @example
 * try {
 *    watchPropagation('myDomain.com');
 * } catch (error) {
 *    console.error(error);
 * }
 */
function watchPropagation(domain) {
  let currentEdgeIndex = 0;
  let intervalId = null;
  const f = feedback.propagation; // TODO: workaround -> improve

  const performFetch = async () => {
    try {
      const response = await fetch(`https://${domain}`);
      if (response.status === 404) {
        f.interactive.await(
          Messages.platform.propagation.info.propagating(
            AzionEdges[currentEdgeIndex],
          ),
        );
        currentEdgeIndex = (currentEdgeIndex + 1) % AzionEdges.length;
      } else {
        clearInterval(intervalId);

        let remainingEdgeIndex = currentEdgeIndex + 1;
        const remainingEdgesIntervalId = setInterval(async () => {
          if (remainingEdgeIndex >= AzionEdges.length) {
            clearInterval(remainingEdgesIntervalId);
            f.interactive.complete(
              Messages.platform.propagation.success.propagation_complete,
            );
            await exec(`${isWindows ? 'start ' : 'open '} https://${domain} `);

            process.exit(0);
          } else {
            const remainingEdge = AzionEdges[remainingEdgeIndex];
            f.interactive.await(
              Messages.platform.propagation.info.propagating(remainingEdge),
            );
            // eslint-disable-next-line no-plusplus
            remainingEdgeIndex++;
          }
        }, 150);
      }
    } catch (error) {
      debug.error(error);
      f.interactive.fatal(
        Messages.propagation.errors.watch_propagation_failed,
      );
    }
  };

  // Perform the first fetch immediately
  performFetch();

  // Start the interval
  intervalId = setInterval(performFetch, 10000);
}

// eslint-disable-next-line import/prefer-default-export
export { watchPropagation };