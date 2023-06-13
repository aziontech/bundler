import { mountAssetUrl, getAzionVersionId } from "#utils";

  try {
    const assetUrl = mountAssetUrl(event.request.url, getAzionVersionId());
    return fetch(assetUrl);
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
