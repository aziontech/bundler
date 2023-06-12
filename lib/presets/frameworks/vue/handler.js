import { mountAssetUrl, generateTimestamp } from "#utils";

try {
  const request_path = new URL(event.request.url).pathname;
  
  const version_id = "{{ .VersionId }}";
  
  let asset_path;
  if (request_path === "/") {
    // If the requested path is just "/", construct the asset path with "/index.html"
    asset_path = version_id + "/index.html";
  } else if (request_path.endsWith("/")) {
    // If the requested path ends with a "/", concatenate the path with "index.html"
    asset_path = version_id + request_path + "index.html";
  } else {
    // For all other cases, use the requested path as the asset path
    asset_path = version_id + request_path;
  }

  // Construct the URL for the requested asset
  const asset_url = new URL(asset_path, "file://");
  // Return the fetch response for the asset
  return fetch(asset_url);

} catch (e) {
  // If there is an error, return a Response object with the error message and a status code of 500
  return new Response(e.message || e.toString(), { status: 500 })
}
