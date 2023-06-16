/**
 * Mounts a request URL for Single-Page Applications (SPA)
 * based on the provided request URL and version ID.
 * @param {string} requestURL - The original URL from the event request.
 * @param {string} versionId - The version ID representing the build/assets stored.
 * @returns {URL} The mounted request URL for the SPA.
 */
export default function mountSPA(requestURL, versionId) {
  /**
   * The path extracted from the request URL.
   * @type {string}
   */
  const requestPath = new URL(requestURL).pathname;

  let assetPath;

  /**
   * Regular expression to match the file extension at the end of a string.
   * Used to determine if the requestPath is an asset or a route.
   * @type {RegExp}
   */
  const fileExtensionRegex = /\.[^.]+$/;

  if (fileExtensionRegex.test(requestPath)) {
    // If the requestPath has a file extension, it is considered an asset.
    // Concatenate the versionId and requestPath to form the complete asset URL.
    assetPath = new URL(`/${versionId}${requestPath}`, 'file://');
  } else {
    // If the requestPath does not have a file extension, it is treated as a route.
    // Append the versionId and the route "index.html" to form the complete asset URL.
    assetPath = new URL(`/${versionId}${requestPath}/index.html`, 'file://');
  }

  return new URL(assetPath, 'file://');
}
