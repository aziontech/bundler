import { mountSSG } from '#edge';
/**
 * Handles the 'fetch' event.
 * @param {any} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handler(event) {
  try {
    const myApp = await mountSSG(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (e) {
    const notFoundError = new URL(`${AZION_VERSION_ID}/404.html`, 'file://');
    return fetch(notFoundError);
  }
}

export default handler;
