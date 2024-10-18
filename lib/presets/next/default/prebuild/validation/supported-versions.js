/**
 * A map that associates frameworks versions with their supported runtimes.
 * @type {Map<string, string[]>}
 */
const VERSION_RUNTIME_MAP_SUPPORT = new Map([
  ['nextjs-12.2.x', ['edge']],
  ['nextjs-12.3.x', ['node', 'edge']],
  ['nextjs-13.0.x', ['edge']],
  ['nextjs-13.1.x', ['edge']],
  ['nextjs-13.2.x', ['edge']],
  ['nextjs-13.3.x', ['edge']],
  ['nextjs-13.4.x', ['edge']],
  ['nextjs-13.5.x', ['edge']],
  ['nextjs-14.0.x', ['edge']],
  ['nextjs-14.1.x', ['edge']],
  ['nextjs-14.2.x', ['edge']],
]);

export default VERSION_RUNTIME_MAP_SUPPORT;
