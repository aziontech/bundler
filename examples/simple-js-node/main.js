/* eslint-disable */
const crypto = require('crypto');

/**
 *
 * @param request
 */
async function handleRequest(event) {
  const uuid = crypto.randomUUID();

  return new Response(uuid, {
    status: 200,
  });
}


export default handleRequest;