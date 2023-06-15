import { mountAssetPath } from "#edge";

  try {
    const assetUrl = mountAssetPath(event.request.url, AZION.VERSION_ID, true);
    return fetch(assetUrl);
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
