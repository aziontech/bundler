import { mountSSG, debugRequest, ErrorHTML } from "#edge";

try {
  debugRequest(event);
  const myApp = await mountSSG(event.request.url, AZION.VERSION_ID);
  return myApp;
} catch (error) {
  return ErrorHTML("404");
}