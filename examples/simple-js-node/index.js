const crypto = require("crypto")

async function handleRequest(request) {
    const uuid = crypto.randomUUID()

    return new Response(uuid, {
        status: 200,
    });
}

addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
});