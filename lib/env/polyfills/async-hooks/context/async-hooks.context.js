/* eslint-disable */
import * as async_hooks from 'async_hooks';

export class AsyncLocalStorage extends async_hooks.AsyncLocalStorage {}
export class AsyncResource extends async_hooks.AsyncResource {}

export default {
  AsyncLocalStorage,
  AsyncResource,
};
