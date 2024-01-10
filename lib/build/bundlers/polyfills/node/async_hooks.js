/* eslint-disable */
export class AsyncLocalStorage {
  constructor() {
    this.store = new Map();
  }

  run(storeData, callback) {
    const key = Symbol();
    this.store.set(key, storeData);
    const restoreData = Object.fromEntries(this.store);

    return callback(restoreData);
  }

  getStore() {
    const allEntries = [...this.store.entries()];
    if (allEntries.length === 0) return undefined;

    const [_, lastValue] = allEntries[allEntries.length - 1];
    return lastValue;
  }

  enterWith(storeData) {
    this.store = new Map(Object.entries(storeData));
  }

  exit() {
    this.store = new Map();
  }
}

export default {
  AsyncLocalStorage,
};
