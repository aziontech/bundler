import auth from './actions/auth.actions.js';
import showFunctionsLogs from './actions/functions/showFunctionsLogs/showFunctionsLogs.actions.js';

/**
 * @typedef {object} CoreObject
 * @property {object} actions - Object containing Azion core actions.
 * @property {auth} actions.auth - Function for user authentication.
 */

/**
 * @type {CoreObject}
 * Contains core-related actions.
 */

const core = {
  actions: { auth },
};

/**
 * @typedef {object} FunctionsObject
 * @property {object} actions - Object containing function actions.
 * @property {showFunctionsLogs} actions.showFunctionsLogs - Action to perform Function logs.
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
