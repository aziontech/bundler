/**
 * @typedef {object} FetchEvent
 * @property {Request} request - This interface represents a resource request.
 * @property {Promise<Response>} respondWith - This interface prevents the browser's
 * default fetch handling,  and allows you to provide a promise for a Response yourself.
 * @property {function(): void} waitUntil  - his interface is used to inform the browser
 * not to terminate the Service Worker until
 * the promise passed to `waitUntil` is either resolved or rejected.
 * @description Represents an event that is dispatched to a worker when a fetch event occurs.
 */
