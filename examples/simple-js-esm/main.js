/* eslint-disable */

import messages from './messages.js';

const message = messages[Math.floor(Math.random() * messages.length)];

function main(event) {
  console.log('selected message:', message);
  console.log('VERSION_ID =', AZION_VERSION_ID);

  return new Response(message, {
    headers: new Headers([
      ["X-Custom-Feat", "my random message"],
    ]),
    status: 200,
  });
}

/* eslint-enable */
