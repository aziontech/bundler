import { FetchEvent } from '#typedef';

/* eslint-disable */
__JS_CODE__;

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handle(event) {
  try {
    return main(event);
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
}
/* eslint-enable */
