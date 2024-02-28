/**
 * @file env-vars.polyfills.js
 * @description Polyfills for Azion ENV Vars.
 *
 * This polyfill is referenced in #build/bundlers/polyfills/polyfills-manager.js
 * Important: This file is a polyfill for Azion ENV Vars, it should be used only in Azion's Edge Computing environment.
 * ENV_VARS_CONTEXT is context to VM environment.
 * @example
 *
 * const value = Azion.env.get('MY_ENV_VAR');
 */
globalThis.Azion = globalThis.Azion || {};

globalThis.Azion.env = {};

/**
 * Azion env vars get method
 * @param {string} key - The environment variable key
 * @returns {string} - The environment variable value
 */
globalThis.Azion.env.get = (key) => {
  // eslint-disable-next-line no-undef
  const value = ENV_VARS_CONTEXT.get(key);
  return value;
};
