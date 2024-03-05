addEventListener("firewall", (event) => {
  const network_list_id = event.request.headers.get("x-network-list-id");

  // https://www.azion.com/en/documentation/products/edge-application/edge-functions/runtime/api-reference/metadata/
  // In local development, the metadata is mocked.
  const remote_addr = event.request.metadata["remote_addr"];
  console.log(`Remote addr: ${remote_addr}`);

  const found = Azion.networkList.contains(network_list_id, remote_addr);
  console.log(`Found: ${found}`);

  if (!found) {
    return event.deny();
  }
  event.continue();
});
