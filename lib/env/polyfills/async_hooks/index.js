/* eslint-disable */
/**
 * ASYNC_LOCAL_STORAGE is defined in runtime.env.js for use on the local server
 */

export class AsyncLocalStorage extends ASYNC_LOCAL_STORAGE.AsyncLocalStorage {}
export class AsyncResource extends ASYNC_LOCAL_STORAGE.AsyncResource {}

export default {
  AsyncLocalStorage,
  AsyncResource,
};
