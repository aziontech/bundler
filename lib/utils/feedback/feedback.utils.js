import signale from 'signale';

import { Utils } from '#namespaces';

const cleanOutputEnabled = process.env.CLEAN_OUTPUT_MODE === 'true';
const cleanOutputConfig = {
  displayScope: false,
  displayBadge: false,
  displayDate: false,
  displayFilename: false,
  displayLabel: false,
  displayTimestamp: false,
  underlineLabel: false,
  underlineMessage: false,
  underlinePrefix: false,
  underlineSuffix: false,
  uppercaseLabel: false,
};

/**
 * Helper function to create a custom interactive logger object.
 * @param {object} options - Configuration options for the logger.
 * @returns {object} A custom logger object.
 */
const getLogger = (options = {}) => {
  const logger = new signale.Signale({ ...options });
  if (cleanOutputEnabled) {
    logger.config(cleanOutputConfig);
  }
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
    badge: '🌋',
    color: 'green',
    label: '',
    logLevel: 'info',
  },
};

const global = new signale.Signale({
  interactive: false,
  scope: 'Vulcan',
  types: methods,
});

if (cleanOutputEnabled) {
  global.config(cleanOutputConfig);
}

/**
 * Predefined log scopes.
 * @type {object}
 */
const scopes = {
  ...global,
  interactive: {
    ...getLogger({ interactive: true, scope: ['Vulcan'], types: methods }),
  },
  server: {
    ...global.scope('Vulcan', 'Server'),
    interactive: getLogger({
      interactive: true,
      scope: ['Vulcan', 'Server'],
      types: methods,
    }),
  },
  runtime: {
    ...global.scope('Vulcan', 'Runtime'),
    interactive: getLogger({
      interactive: true,
      scope: ['Vulcan', 'Runtime'],
      types: methods,
    }),
  },
  prebuild: {
    ...global.scope('Vulcan', 'Prebuild'),
    interactive: getLogger({
      interactive: true,
      scope: ['Vulcan', 'Prebuild'],
      types: methods,
    }),
  },
  build: {
    ...global.scope('Vulcan', 'Build'),
    interactive: getLogger({
      interactive: true,
      scope: ['Vulcan', 'Build'],
      types: methods,
    }),
  },
  postbuild: {
    ...global.scope('Vulcan', 'Postbuild'),
    interactive: getLogger({
      interactive: true,
      scope: ['Vulcan', 'Postbuild'],
      types: methods,
    }),
  },
};

/**
 * @function
 * @memberof Utils
 * @description Feedback object that facilitates log display.
 * It includes all logging methods provided by 'signale'.
 * If the environment variable CLEAN_OUTPUT_MODE is set to 'true', all log methods use console.log,
 * providing cleaner and unstyled output. This is particularly useful
 * for other clients intending to use Vulcan
 * in the background, where stylized console output may be less desirable.
 * For more information about the Signale logging methods, refer to its documentation (https://github.com/klaussinani/signale).
 * @type {object}
 */
const feedback = { ...scopes };

export default feedback;
