/* eslint-disable */

addEventListener("firewall", (event) => {
  // https://www.azion.com/en/documentation/products/edge-application/edge-functions/runtime/api-reference/metadata/
  // In local development, the metadata is mocked.
  const { geoip_country_name } = event.request.metadata;

  event.addRequestHeader("X-Broccoli-Cooking-Method", "Boiling");
  event.addResponseHeader("X-Broccoli-Cooking-Method", "Barbecue");

  // event respondWith or event.deny must be called
  event.respondWith(
    new Response("The broccoli is burning.", {
      headers: {
        "X-Fire-Status": "On",
        "X-Fire-Type": "Coal",
        "X-Country-Name": geoip_country_name,
      },
      status: 417,
    })
  );

  // event.deny();
});
