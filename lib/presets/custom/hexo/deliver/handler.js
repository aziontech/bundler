import { mountSSG, ErrorHTML } from '#edge';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
// eslint-disable-next-line
async function handle(event) {
  try {
    const myApp = await mountSSG(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (e) {
    return ErrorHTML('404');
  }
}
