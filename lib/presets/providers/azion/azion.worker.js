import { FetchEvent } from '#types';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handleEvent(event) {
  // TODO: call preset framework handler
  console.log(event)
}

/**
 * Event listener for the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 */
// eslint-disable-next-line no-restricted-globals
addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
});
