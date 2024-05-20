import { ErrorHTML, mountSSG } from '#edge';
/**
 * Handles the 'fetch' event.
 * @param {any} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handler(event) {
  try {
    const myApp = await mountSSG(event.request.url);
    return myApp;
  } catch (error) {
    return ErrorHTML('404');
  }
}

export default handler;
