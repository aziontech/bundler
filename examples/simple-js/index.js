const messages = require("./messages")

async function handleRequest(request) {
    const message = messages[Math.floor(Math.random() * messages.length)];

    return new Response(message, {
        headers: new Headers([
            ["X-Custom-Feat", "my random message"],
        ]),
        status: 200,
    });
}

addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
});