import { mountSSG } from "#edge";

try {
  const myApp = await mountSSG(event.request.url, AZION.VERSION_ID);
  return myApp;
} catch (e) {
  const notFoundError = new URL(`${AZION.VERSION_ID}/404.html`, 'file://')
  return fetch(notFoundError)
}
