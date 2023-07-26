import { mountSSG, ErrorHTML, debugRequest } from '#edge';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handle(event) {
  try {
    debugRequest(event);
    const myApp = await mountSSG(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (error) {
    return ErrorHTML('404');
  }
}
