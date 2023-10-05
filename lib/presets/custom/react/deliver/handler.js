import { mountSPA, ErrorHTML } from '#edge';
/**
 * Handles the 'fetch' event.
 * @param {any} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
// eslint-disable-next-line
async function handler(event) {
  try {
    const myApp = await mountSPA(event.request.url, AZION_VERSION_ID);
    return myApp;
  } catch (e) {
    return ErrorHTML('404');
  }
}

export default handler;
