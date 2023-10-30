async function handleRequest(request) {
  const data = {
    message: "My message!"
  }

  return new Response(JSON.stringify(data), {
    headers: new Headers([
      ["Content-Type", "application/json"],
    ]),
    status: 200,
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});