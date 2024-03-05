export default async function main(event) {
    const request = event.request;
    if (
      !request.headers.get("x-network-list-id") ||
      !request.headers.get("x-element")
    ) {
      return new Response("Missing headers", { status: 400 });
    }
  
    let network_list_id = request.headers.get("x-network-list-id");
    let element = request.headers.get("x-element");
  
    let response_headers = new Headers();
    response_headers.set("X-Element", element);
  
    if (Azion.networkList.contains(network_list_id, element)) {
      response_headers.set("X-Presence", "present");
    } else {
      response_headers.set("X-Presence", "absent");
    }
  
    return new Response("", { headers: response_headers });
  }
  