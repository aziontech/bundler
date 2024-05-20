import { normalizePath } from './fs.js';

/**
 * Strip route groups from a path name.
 *
 * The build output config does not rewrite requests to route groups, so we need to strip route
 * groups from the path name for file system matching.
 * @param {string} path Path name to strip route groups from.
 * @returns {string} Path name with route groups stripped.
 */
export function stripRouteGroups(path) {
  return path.replace(/\/\(([^)]+)\)/g, '');
}

/**
 * Add a leading slash to a path name if it doesn't already have one.
 *
 * Used to ensure that the path name starts with a `/` for matching in the routing system.
 * @param {string} path Path name to add a leading slash to.
 * @returns {string} Path name with a leading slash added.
 */
export function addLeadingSlash(path) {
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Strip `/index` from a path name.
 *
 * The build output config does not rewrite `/` to `/index`, so we need to strip `/index` from the
 * path name for request matching.
 * @param {string} path Path name to strip `/index` from.
 * @returns {string} Path name with `/index` stripped.
 */
export function stripIndexRoute(path) {
  // add leading slash back if it is stripped when `/index` is removed
  return addLeadingSlash(path.replace(/\/index$/, ''));
}

/**
 * Strip the `.func` extension from a path name.
 * @param {string} path Path name to strip the `.func` extension from.
 * @returns {string} Path name with the `.func` extension stripped.
 */
export function stripFuncExtension(path) {
  return path.replace(/\.func$/, '');
}

/**
 * Format a route's path name for matching in the routing system.
 *
 * - Strip the `.func` extension.
 * - Normalize the path name.
 * - Strip route groups (the build output config does not rewrite requests to route groups).
 * - Add a leading slash.
 * @param {string} path Route path name to format.
 * @returns {string} Formatted route path name.
 */
export function formatRoutePath(path) {
  return addLeadingSlash(
    stripRouteGroups(addLeadingSlash(normalizePath(stripFuncExtension(path)))),
  );
}
