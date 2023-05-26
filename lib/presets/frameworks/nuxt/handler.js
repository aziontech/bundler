import { mountAssetUrl } from '#utils';

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
const handler = (event) => {
    try {
        // eslint-disable-next-line no-undef
        const assetUrl = mountAssetUrl(event.request.url, VERSION_ID);
        return fetch(assetUrl);
    } catch (e) {
        return new Response(e.message || e.toString(), { status: 500 });
    }
}

export default handler;