import { Edge } from '#namespaces';

/**
 * @function
 * @memberof Edge
 * @description Formats the request and error information for logging.
 * @param {Error} error - The error object.
 * @returns {string} The formatted log string.
 */
function formatLog(error) {
  let formattedLog = '';

  if (error) {
    const formattedError = error instanceof Error ? error.stack : error;
    formattedLog += `<b>Error:</b>\n${formattedError}`;
  }

  return formattedLog;
}

/**
 * @function
 * @memberof Edge
 * @description Creates the HTML content for the custom error page.
 * @param {number} errorCode - The error code.
 * @param {string} errorDescription - The error description.
 * @param {Error} [error] - Optional. The debug object containing error object.
 * @returns {string} The HTML content.
 */
function createErrorHTML(errorCode, errorDescription, error) {
  const formattedLog = formatLog(error);

  return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error ${errorCode} - ${errorDescription}</title>
        <style>
          body {
            background-color: black;
            color: rgb(255, 108, 55);
            font-family: Arial, sans-serif;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          h1 {
            font-size: 36px;
            margin-bottom: 10px;
            animation: levitate 2s ease-in-out infinite alternate;
          }
          p {
            font-size: 18px;
            margin-bottom: 5px;
          }
          a {
            color: rgb(255, 108, 55);
            text-decoration: none;
          }
      
          @keyframes levitate {
            0% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
            100% {
              transform: translateY(0);
            }
          }
        </style>
      </head>
      <body>
        <h1>Error ${errorCode}</h1>
        <p>${errorDescription || ''}</p>
        <pre>${formattedLog}</pre>
      </body>
      </html>`;
}

/**
 * @function
 * @memberof Edge
 * @description Handles an error by logging the request and error
 * information and returning a custom HTML response.
 * @param {number} code - The error code.
 * @param {string} description - The error description.
 * @param {Error} [error] - Optional. The error object for debugging.
 *  If provided, the error will be displayed on the error page.
 * @returns {Response} The custom HTML response.
 */
function ErrorHTML(code, description, error) {
  const errorHTML = createErrorHTML(code, description, error);
  const headers = { 'Content-Type': 'text/html' };
  return new Response(errorHTML, { status: code, headers });
}

export default ErrorHTML;
