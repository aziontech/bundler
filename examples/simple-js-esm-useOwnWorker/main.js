/* eslint-disable*/
async function handleRequest(request) {
  return new Response('Hello world in a new response', {
    headers: new Headers([['X-Custom-Header', 'something defined on JS']]),
    status: 200,
  });
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});
