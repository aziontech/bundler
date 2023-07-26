import { mountSPA, debugRequest, ErrorHTML } from '#edge';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handle(event) {
  try {
    debugRequest(event);
    const myApp = await mountSPA(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (e) {
    return ErrorHTML('404');
  }
}
