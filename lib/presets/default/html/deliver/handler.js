/* eslint-disable */
import { mountSSG } from '#edge';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handle(event) {
  try {
    const myApp = await mountSSG(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (e) {
    const notFoundError = new URL(`${AZION_VERSION_ID}/404.html`, 'file://');
    return fetch(notFoundError);
  }
}
/* eslint-enable */
