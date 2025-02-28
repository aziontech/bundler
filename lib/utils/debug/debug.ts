/**
 * @function
 
 * @description Debug method that conditionally logs based on process.env.DEBUG.
 * Inherits all methods from console.log.
 * @description By default, process.env.DEBUG is set to false.
 * When enabled, this method overrides console.log and allows you to log debug messages during
 * development without showing them to the end user. It provides a convenient way to debug your
 * code without the need to manually remove console.log statements.
 * @example
 * // Enable debug mode by setting process.env.DEBUG to true
 * process.env.DEBUG = true;
 *
 * // Log a debug message
 * debug.log('This is a debug message');
 */

const debug: { [key: string]: (...args: any[]) => void } = {};
const debugEnabled = process.env.DEBUG === 'true';

/**
 * Iterate over the console methods and create corresponding debug methods.
 */
Object.keys(console).forEach((method: string) => {
  if (typeof (console as Console)[method as keyof Console] === 'function') {
    debug[method] = (...args) => {
      if (debugEnabled) {
        (console as any)[method](...args);
      }
    };
  }
});

export default debug;
