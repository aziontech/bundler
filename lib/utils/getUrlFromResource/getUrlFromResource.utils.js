import { Utils } from '#namespaces';

/**
 * @function
 * @memberof Utils
 * @description Creates a URL object based on a received resource
 * @param {URL|Request|string} resource received resource.
 * @returns {URL} Generated URL object.
 */
function getUrlFromResource(resource) {
  if (typeof resource === 'string') return new URL(resource);

  if (resource instanceof Request) return new URL(resource.url);

  if (resource instanceof URL) return resource;

  throw new Error(
    "Invalid resource input. 'resource' must be 'URL', 'Request' or 'string'.",
  );
}

export default getUrlFromResource;
