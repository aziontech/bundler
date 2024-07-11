/* eslint-disable import/prefer-default-export */
/**
 * We are not exporting the fs.polyfill.js from this structure due to the context definition in runtime.env.js.
 * As we are proxying the Node.js fs lib, it is not possible to export the fs.polyfill.js file.
 */
import fsContext from './context/fs.context.js';

export { fsContext };
