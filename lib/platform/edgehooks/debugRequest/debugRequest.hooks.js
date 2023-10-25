import { Edge } from '#namespaces';

/**
 * @function
 * @memberof Edge
 * @description The `DebugRequest` function is used to debug and display the details of an incoming request.
 * It takes the request as a parameter and logs the request URL, method, and headers to the console.
 * @param {any} event - The incoming FetchEvent object.
 * @returns {Promise<void>} A promise that resolves once the request details are logged.
 */
async function DebugRequest(event) {
  const { request } = event;
  const headers = new Headers(request.headers);

  const requestData = {
    url: request.url,
    method: request.method,
    headers: {},
  };

  headers.forEach((value, name) => {
    requestData.headers[name] = value;
  });

  return event.console.log(requestData);
}

export default DebugRequest;
