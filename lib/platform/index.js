// core
import auth from './actions/core/auth.actions.js';
import deploy from './actions/core/deploy.actions.js';
import { uploadStatics } from './actions/core/storage.actions.js';
import { watchPropagation } from './actions/core/propagation.actions.js';
// domain
import createDomain from './actions/domain/createDomain.actions.js';

// application
import createApplication from './actions/application/createApplication.actions.js';
import enableEdgeFunctions from './actions/application/enableEdgeFunctions.actions.js';
import instantiateFunction from './actions/application/instantiateFunction.actions.js';
import setFunctionAsDefaultRule from './actions/application/setFunctionAsDefaultRule.actions.js';

// function
import showFunctionLogs from './actions/function/showFunctionLogs.actions.js';
import updateFunction from './actions/function/updateFunction.actions.js';

/**
 * Object containing core-related actions.
 * @typedef {object} CoreObject
 * @property {object} actions - Object containing Azion core actions.
 * @property {auth} actions.auth - Action for Azion authentication.
 * @property {uploadStatics} actions.uploadStatics - Action for uploading static files.
 * @property {deploy} actions.deploy - Action for deploying application.
 * @property {watchPropagation} actions.watchPropagation - Action for watch Edge Propagation.
 */
const core = {
  actions: {
    auth,
    deploy,
    uploadStatics,
    watchPropagation,
  },
};

const applications = {
  actions: {
    createApplication,
    enableEdgeFunctions,
    instantiateFunction,
    showFunctionLogs,
    setFunctionAsDefaultRule,
  },
};

/**
 * Object containing domain-related actions.
 * @typedef {object} DomainsObject
 * @property {object} actions - Object containing Azion domain actions.
 * @property {createDomain} actions.createDomain - Action to create a domain.
 */
const domains = {
  actions: { createDomain },
};

/**
 * Object containing function-related actions.
 * @typedef {object} FunctionsObject
 * @property {object} actions - Object containing Azion function actions.
 * @property {showFunctionLogs} actions.showFunctionLogs - Action to perform Azion function logs.
 * @property {updateFunction} actions.updateFunction - Action to update Azion function.
 */
const functions = {
  actions: { showFunctionLogs, updateFunction },
};

export { core, applications, domains, functions };
