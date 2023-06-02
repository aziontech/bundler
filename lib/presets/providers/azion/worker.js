async function handleEvent(event) {
  __HANDLER__
}

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event));
});