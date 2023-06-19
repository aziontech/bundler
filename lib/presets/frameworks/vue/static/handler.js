import { mountSPA } from "#edge";

  try {
    const myApp = await mountSPA(event.request.url, AZION.VERSION_ID);
    return myApp;
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 }); // TODO: create Azion/Vulcan custom 404
  }
