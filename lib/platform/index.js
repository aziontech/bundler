import showFunctionsLogs from './actions/functions/showFunctionsLogs/showFunctionsLogs.actions.js';

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
export { functions };
