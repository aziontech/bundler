/**
 * Mounts an asset URL based on the provided request URL and version ID.
 * @param {string} requestURL - The original URL from the event request.
 * @param {string} v - The version ID to be appended to the asset URL.
 * @returns {URL} The mounted asset URL.
 */
export default function mountAssetUrl(requestURL, v) {
  const requestPath = new URL(requestURL).pathname;
  const versionId = v;
  const defaultRoute = versionId.concat('/index.html');
  const customRoute = versionId.concat(requestPath);
  const assetUrl = new URL(requestPath === '/' ? defaultRoute : customRoute, 'file://');
  return assetUrl;
}
