import { Edge } from '#namespaces';

/**
 * @function
 * @memberof Edge
 * @description The `mountSPA` function is designed to process requests to a Single Page Application (SPA)
 * that's being computed at the edge of a Content Delivery Network (CDN).
 *
 * This function determines if the incoming request is for a static
 * asset or a route within the application,
 * and mounts the appropriate request URL for fetching the required resource from the origin server.
 * @param {string} requestURL - The original URL from the incoming request.
 * @param {string} versionId - The version ID representing the build/assets stored.
 * @returns {Promise<Response>} A promise that resolves to the response from the fetched resource.
 * @example
 * // Handle a request for a homepage
 * // Input: mountSSG('https://example.com/', 'v1');
 * // Output: fetch('file:///v1/index.html');
 * @example
 * // Handle a request for an asset (CSS file)
 * // Input: mountSSG('https://example.com/styles/main.css', 'v1');
 * // Output: fetch('file:///v1/styles/main.css');
 * @example
 * // Handle a request for a specific route
 * // Input: mountSSG('https://example.com/about', 'v1');
 * // Output: fetch('file:///v1/index.html');
 */
function mountSPA(requestURL, versionId) {
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
    assetPath = new URL(`/${versionId}/index.html`, 'file://');
  }

  return fetch(assetPath);
}

export default mountSPA;
