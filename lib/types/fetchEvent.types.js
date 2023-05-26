/**
 * @typedef {object} FetchEvent
 * @property {Request} request
 * @property {Promise<Response>} respondWith
 * @property {function(): void} waitUntil - Adds a promise to the event's flow.
 * @description Represents an event that is dispatched to a worker when a fetch event occurs.
 */
