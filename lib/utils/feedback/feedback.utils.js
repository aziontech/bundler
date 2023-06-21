import signale from 'signale';

const methods = {
  deployed: {
    badge: '🚀',
    color: 'green',
    label: 'forged',
    logLevel: 'info',
  },
};

const interactive = (scope) => new signale.Signale({ interactive: true, scope: scope ? ['Vulcan', scope] : 'Vulcan', types: methods });
const global = new signale.Signale({ interactive: false, scope: 'Vulcan', types: methods });

const scopes = {
  ...global,
  interactive,
  prebuild: { ...global.scope('Vulcan', 'Pre Build'), interactive: interactive('prebuild') },
  build: { ...global.scope('Vulcan', 'Build'), interactive: interactive('build') },
  platform: {
    ...global.scope('Vulcan', 'Platform'),
    interactive: interactive('Platform'),
  },
  statics: { ...global.scope('Vulcan', 'Statics'), interactive: interactive('statics') },
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
