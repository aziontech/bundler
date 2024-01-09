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
  console.log('VERSION_ID =', AZION_VERSION_ID);
  console.log('VULCAN_PATH =', VULCAN_PATH);

  return new Response(data, {
    headers: new Headers([['X-Custom-Feat', 'my random message']]),
    status: 200,
  });
}

export default main;
