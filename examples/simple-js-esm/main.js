/* eslint-disable */

import messages from './messages.js';

const message = messages[Math.floor(Math.random() * messages.length)];

console.log('selected message:', message);

return new Response(message, {
  headers: new Headers([
    ["X-Custom-Feat", "my random message"],
  ]),
  status: 200,
});
