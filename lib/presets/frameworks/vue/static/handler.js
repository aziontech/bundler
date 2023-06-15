import { mountAssetUrl } from "#edge";

  try {
    const assetUrl = mountAssetUrl(event.request.url, AZION.VERSION_ID);
    return fetch(assetUrl);
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
