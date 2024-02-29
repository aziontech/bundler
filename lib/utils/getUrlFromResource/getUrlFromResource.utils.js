import { Utils } from '#namespaces';

/**
 * @function
 * @memberof Utils
 * @param {globalThis} context - VMContext
 * @description Creates a URL object based on a received resource
 * @param {URL|Request|string} resource received resource.
 * @returns {URL} Generated URL object.
 */
function getUrlFromResource(context, resource) {
  if (typeof resource === 'string') return new URL(resource);

  if (resource instanceof context.Request) return new URL(resource.url);

  if (resource instanceof context.URL) return resource;

  throw new Error(
    "Invalid resource input. 'resource' must be 'URL', 'Request' or 'string'.",
  );
}

export default getUrlFromResource;
