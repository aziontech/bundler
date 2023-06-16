import { mountSPA } from "#edge";

  try {
    const myApp = mountSPA(event.request.url, AZION.VERSION_ID);
    return fetch(myApp);
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
