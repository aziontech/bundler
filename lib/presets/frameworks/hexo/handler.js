async function handleEvent(event) {
  try {
    const request_path = new URL(event.request.url).pathname;
    const version_id = VERSION_ID;
    const defaultRoute = version_id.concat("/index.html");
    const customRoute = version_id.concat(request_path);
    const asset_url = new URL(request_path === "/" ? defaultRoute : customRoute, "file://");

    return fetch(asset_url);

  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 })
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleEvent(event))
})