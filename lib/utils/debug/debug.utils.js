/**
 * Debug method that conditionally logs based on process.env.DEBUG.
 * Inherits all methods from console.log.
 * @function
 * @param {...*} args - Arguments to be logged.
 * @description By default, process.env.DEBUG is set to false.
 */
const debug = {};
const debugEnabled = process.env.DEBUG === 'true';

/**
 * Iterate over the console methods and create corresponding debug methods.
 */
Object.keys(console).forEach((method) => {
  if (typeof console[method] === 'function') {
    debug[method] = (...args) => {
      if (debugEnabled) {
        console[method](...args);
      }
    };
  }
});

export default debug;
