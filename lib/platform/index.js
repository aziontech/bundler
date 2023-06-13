import auth from './actions/auth.actions.js';
import { uploadStatics } from './actions/storage.actions.js';
import showFunctionsLogs from './actions/functions/showFunctionsLogs/showFunctionsLogs.actions.js';

/**
 * @typedef {object} CoreObject
 * @property {object} actions - Object containing Azion core actions.
 * @property {auth} actions.auth - Function for Azion authentication.
 * @property {auth} actions.uploadStatics - TODO
/**
 * @type {CoreObject}
 * Contains core-related actions.
 */

const core = {
  actions: { auth, uploadStatics },
};

/**
 * @typedef {object} FunctionsObject
 * @property {object} actions - Object containing Azion Function actions.
 * @property {showFunctionsLogs} actions.showFunctionsLogs - Action to perform Azion Function logs.
 */
/**
 * @type {FunctionsObject}
 * Contains function-related actions.
 */
const functions = {
  actions: { showFunctionsLogs },
};

// eslint-disable-next-line import/prefer-default-export
export { core, functions };
