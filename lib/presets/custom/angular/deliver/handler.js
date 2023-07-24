import { mountSPA, ErrorHTML } from '#edge';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
// eslint-disable-next-line no-unused-vars
async function handle(event) {
  try {
    const myApp = await mountSPA(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (e) {
    return ErrorHTML('404');
  }
}
