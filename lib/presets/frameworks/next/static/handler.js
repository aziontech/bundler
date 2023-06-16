import { mountSSG } from "#edge";

  try {
    const myApp = mountSSG(event.request.url, AZION.VERSION_ID);
    const response = await fetch(myApp)
    return response;
  } catch (e) {
    const notFoundError = new URL(`${AZION.VERSION_ID}/404.html`, 'file://')
    return fetch(notFoundError)
  }
