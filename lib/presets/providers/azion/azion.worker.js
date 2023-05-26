import { mountAssetUrl } from '#utils';
import { FetchEvent } from '#types';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handleEvent(event) {
  try {
    // eslint-disable-next-line no-undef
    const assetUrl = mountAssetUrl(event.request.url, VERSION_ID);
    return fetch(assetUrl);
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
}

/**
 * Event listener for the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 */
// eslint-disable-next-line no-restricted-globals
addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
});
