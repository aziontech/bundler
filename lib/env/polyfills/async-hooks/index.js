/* eslint-disable import/prefer-default-export */
/**
 * We are not exporting the async_hooks.polyfill.js from this structure due to the context definition in runtime.env.js.
 * As we are proxying the Node.js async_hooks lib, it is not possible to export the async_hooks.polyfill.js file.
 */
import AsyncHooksContext from './context/index.js';

export { AsyncHooksContext };
