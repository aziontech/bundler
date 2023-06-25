import signale from 'signale';
/**
 * Helper function to create a custom logger object.
 * @param {object} options - Configuration options for the logger.
 * @returns {object} A custom logger object.
 */
const getLogger = (options = {}) => {
  const logger = new signale.Signale({ ...options });
  return Object.assign(logger, {
    breakInteractiveChain: () => console.log(),
  });
};

const methods = {
  deployed: {
    badge: '🚀',
    color: 'green',
    label: 'forged',
    logLevel: 'info',
  },
  option: {
    badge: '🟣',
    color: 'magenta',
    label: 'option',
    logLevel: 'info',
  },
};

/**
 * Global log object.
 * @type {object}
 */
const global = new signale.Signale({ interactive: false, scope: 'Vulcan', types: methods });

/**
 * Predefined log scopes.
 * @type {object}
 */
const scopes = {
  ...global,
  prebuild: { ...global.scope('Vulcan', 'Pre Build'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Pre Build'], types: methods }) },
  build: { ...global.scope('Vulcan', 'Build'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Build'], types: methods }) },
  platform: { ...global.scope('Vulcan', 'Platform'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Plataform'], types: methods }) },
  statics: { ...global.scope('Vulcan', 'Statics'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Statics'], types: methods }) },
  propagation: { ...global.scope('Azion', 'Edge Network'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Azion Network'], types: methods }) },
};
/**
 * Feedback object that facilitates log display.
 * @type {object}
 * @property {Function} success - Log method for a successful operation.
 * @property {Function} error - Log method for an error during an operation.
 * @property {Function} fatal - Log method for an fatal error during an operation.
 *  @property {Function} info - Log method for providing information about platform operations.
 * @property {Function} await - Log method for awaiting an interactive operation.
 * @property {Function} complete - Log method for a completed interactive operation.
 */

const feedback = {
  time(label) {
    signale.time(label);
  },
  timeEnd(label) {
    signale.timeEnd(label);
  },
  ...scopes,
};

export default feedback;
