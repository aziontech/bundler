import { mountSSG, ErrorHTML } from '#edge';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
// eslint-disable-next-line no-unused-vars
async function handle(event) {
  try {
    const myApp = await mountSSG(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (error) {
    return ErrorHTML('404');
  }
}
