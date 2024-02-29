import messages from './messages.js';

/* eslint-disable */
/**
 *
 * @param {FetchEvent} event
 */
function main(event) {
  const message = messages[Math.floor(Math.random() * messages.length)];
  const data = `Generated message: ${message}`

  console.log('selected message:', message);

  return new Response(data, {
    headers: new Headers([['X-Custom-Feat', 'my random message']]),
    status: 200,
  });
}

export default main;
