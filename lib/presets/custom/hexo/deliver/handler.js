import { mountSSG, ErrorHTML, debugRequest } from '#edge';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
// eslint-disable-next-line no-unused-vars
async function handle(event) {
  try {
    debugRequest(event);
    const myApp = await mountSSG(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (e) {
    return ErrorHTML('404');
  }
}
