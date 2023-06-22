import signale from 'signale';

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
};

const global = new signale.Signale({ interactive: false, scope: 'Vulcan', types: methods });

const scopes = {
  ...global,
  prebuild: { ...global.scope('Vulcan', 'Pre Build'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Pre Build'], types: methods }) },
  build: { ...global.scope('Vulcan', 'Build'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Build'], types: methods }) },
  platform: { ...global.scope('Vulcan', 'Platform'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Plataform'], types: methods }) },
  statics: { ...global.scope('Vulcan', 'Statics'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Statics'], types: methods }) },
  propagation: { ...global.scope('Azion', 'Edge Network'), interactive: getLogger({ interactive: true, scope: ['Vulcan', 'Azion Network'], types: methods }) },
};

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
