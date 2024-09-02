/* eslint-disable */
/**
 * Handles the 'fetch' event.
 * @param {import('azion/types').FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handler(event) {
  try {
    __JS_CODE__;
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
}

export default handler;
