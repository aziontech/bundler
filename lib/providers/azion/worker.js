/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handleEvent(event) {
  __HANDLER__;
}

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
});
