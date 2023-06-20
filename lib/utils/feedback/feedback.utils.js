import signale from 'signale';

// const methods = {
//   deployed: {
//     badge: '**',
//     color: 'yellow',
//     label: 'deployed',
//     logLevel: 'info',
//   },
// };

// const vulcan = new signale.Signale({
//   displayFilename: true,
//   displayTimestamp: true,
//   displayDate: true,
//   disabled: false,
//   interactive: false,
//   logLevel: 'info',
//   scope: 'global',
//   secrets: [],
//   stream: process.stdout,
//   types: {
//     ...methods,
//   },
// });

signale.config({
  // displayTimestamp: true,
  // displayDate: true,
});

const feedback = {
  log: (...args) => {
    signale.log(...args);
  },
  success: (...args) => {
    signale.success(...args);
  },
  error: (...args) => {
    signale.error(...args);
  },
  warn: (...args) => {
    signale.warn(...args);
  },
  info: (...args) => {
    signale.info(...args);
  },
  interactive: new signale.Signale({ interactive: true, scope: 'Interactive Feedback' }),
};
export default feedback;
