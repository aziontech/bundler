import { AzionEdges } from '#constants';
import logUpdate from 'log-update';
import { exec } from 'child_process';
/**
 * Monitors the propagation of a domain in the edge networks after the FIRST deployment.
 * Fetches the specified domain at regular intervals to check for propagation status.
 * If a 404 error is received, it indicates that the domain is still propagating.
 * If a response other than 404 is received, it indicates that the domain has propagated
 * to the edge networks and is ready to be accessed.
 * @param {string} domain - The domain to monitor for propagation.
 */
function watchPropagation(domain) {
  let currentEdgeIndex = 0;
  let intervalId = null;

  const performFetch = async () => {
    try {
      const response = await fetch(`https://${domain}`);
      if (response.status === 404) {
        logUpdate(`Propagating to ${AzionEdges[currentEdgeIndex]}...`);
        currentEdgeIndex = (currentEdgeIndex + 1) % AzionEdges.length;
      } else {
        clearInterval(intervalId);

        let remainingEdgeIndex = currentEdgeIndex + 1;
        const remainingEdgesIntervalId = setInterval(() => {
          if (remainingEdgeIndex >= AzionEdges.length) {
            clearInterval(remainingEdgesIntervalId);
            logUpdate.clear();
            console.log('Application has propagated to the edge networks and is ready to be accessed!');
            exec(`open https://${domain}`);
            process.exit(0);
          } else {
            const remainingEdge = AzionEdges[remainingEdgeIndex];
            logUpdate(`Propagating to ${remainingEdge}...`);
            // eslint-disable-next-line no-plusplus
            remainingEdgeIndex++;
          }
        }, 150);
      }
    } catch (error) {
      console.error('Error occurred while watching propagation:', error);
    }
  };

  // Perform the first fetch immediately
  performFetch();

  // Start the interval
  intervalId = setInterval(performFetch, 10000);
}

// eslint-disable-next-line import/prefer-default-export
export { watchPropagation };
