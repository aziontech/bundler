import { mountSSG } from "#edge";

  try {
    const myApp = mountSSG(event.request.url, AZION.VERSION_ID);
    return fetch(myApp);
  } catch (e) {
    const notFoundError = new URL(`${versionId}/404.html`, 'file://')
    return fetch(notFoundError)
  }
