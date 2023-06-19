/**
 * Mounts a request URL for Static Site Generation (SSG)
 * based on the provided request URL and version ID.
 * @param {string} requestURL - The original URL from the event request.
 * @param {string} versionId - The version ID representing the build/assets stored.
 * @returns {URL} The mounted request URL for SSG.
 */
export default function mountSSG(requestURL, versionId) {
  /**
   * The path extracted from the request URL.
   * @type {string}
   */
  const requestPath = new URL(requestURL).pathname;

  // Check if the requestPath has a trailing slash and remove the trailing slash if it exists
  const hasTrailingSlash = requestPath.endsWith('/');
  const cleanRequestPath = hasTrailingSlash ? requestPath.slice(0, -1) : requestPath;

  /**
   * Regular expression to match the file extension at the end of a string.
   * Used to determine if the requestPath is an asset or a route.
   * @type {RegExp}
   */
  const fileExtensionRegex = /\.[^.]+$/;

  let assetPath;

  if (cleanRequestPath === '/') {
    // If the requestPath is the root path, append the versionId and 'index.html' to the assetPath.
    assetPath = new URL(`/${versionId}/index.html`, 'file://');
  } else if (fileExtensionRegex.test(cleanRequestPath)) {
    // If the requestPath has a file extension, it is considered an asset.
    // Concatenate the versionId and requestPath to form the complete asset URL.
    assetPath = new URL(`/${versionId}${cleanRequestPath}`, 'file://');
  } else {
    // If the requestPath is a route without a file extension,
    // Append the versionId and requestPath to the assetPath.
    assetPath = new URL(`/${versionId}${cleanRequestPath}/index.html`, 'file://');
  }

  return new URL(assetPath, 'file://');
}
