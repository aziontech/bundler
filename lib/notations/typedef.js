/**
 * Represents an event object received by a Azion Cells.
 * @typedef {object} FetchEvent
 * @property {Request} request - The incoming HTTP request.
 * @property {Response} response - The HTTP response object.
 * @property {string} type - The type of event (e.g., 'fetch', 'scheduled', etc.).
 * @property {EventOptions} options - Options for handling the event.
 */

/**
 * Represents an HTTP request.
 * @typedef {object} Request
 * @property {string} method - The HTTP method (e.g., 'GET', 'POST').`
 * @property {Headers} headers - HTTP headers of the request.
 * @property {string} url - The URL of the request.
 * @property {object} body - The body of the request (parsed based on content type).
 */

/**
 * Represents an HTTP response.
 * @typedef {object} Response
 * @property {number} status - The HTTP status code (e.g., 200, 404).
 * @property {Headers} headers - HTTP headers of the response.
 * @property {string|ReadableStream|ArrayBuffer|FormData|Blob} body - The response body.
 */

/**
 * Represents options for handling a Azion Cells event.
 * @typedef {object} EventOptions
 * @property {boolean} passThroughOnException - Whether to pass the event through when an exception occurs.
 * @property {string} waitUntil - A promise that can be used to wait for asynchronous operations to complete.
 */
