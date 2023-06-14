import auth from './actions/core/auth.actions.js';
import { uploadStatics } from './actions/core/storage.actions.js';
import showFunctionsLogs from './actions/function/showFunctionsLogs.actions.js';
import createDomain from './actions/domain/createDomain.actions.js';
import buildFromScratch from './actions/application/buildFromScratch.actions.js';

/**
 * Object containing core-related actions.
 * @typedef {object} CoreObject
 * @property {object} actions - Object containing Azion core actions.
 * @property {auth} actions.auth - Function for Azion authentication.
 * @property {uploadStatics} actions.uploadStatics - TODO
 */

const core = {
  actions: { auth, uploadStatics },
};

/**
 * Object containing application-related actions.
 * @typedef {object} ApplicationsObject
 * @property {object} actions - Object containing Azion application actions.
 * @property {buildFromScratch} actions.buildFromScratch - Action to build an
 * application from scratch.
 */
const applications = {
  actions: { buildFromScratch },
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
 * @property {showFunctionsLogs} actions.showFunctionsLogs - Action to perform Azion function logs.
 */
const functions = {
  actions: { showFunctionsLogs },
};

export {
  core, applications, domains, functions,
};
