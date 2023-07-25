/* eslint-disable */
__HANDLER__

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handleEvent(event) {
  return handle(event);
}

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
});
/* eslint-enable */
