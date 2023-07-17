import { mountSSG } from "#edge";

try {
  const myApp = await mountSSG(event.request.url, AZION_VERSION_ID);
  return myApp;
} catch (e) {
  const notFoundError = new URL(`${AZION_VERSION_ID}/404.html`, 'file://')
  return fetch(notFoundError)
}
