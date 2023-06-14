/**
 * Mounts an asset URL based on the provided request URL and version ID.
 * @param {string} requestURL - The original URL from the event request.
 * @param {string} versionId - The version ID to be appended to the asset URL.
 * @returns {URL} The mounted asset URL.
 */
export default function mountAssetPath(requestURL, versionId) {
  const requestPath = new URL(requestURL).pathname;
  let assetPath;
  if (requestPath === '/') {
    assetPath = versionId.concat('/index.html');
  } else if (requestPath.endsWith('/')) {
    assetPath = versionId.concat(versionId, requestPath, 'index.html');
  } else {
    assetPath = versionId.concat(requestPath);
  }

  return new URL(assetPath, 'file://');
}
