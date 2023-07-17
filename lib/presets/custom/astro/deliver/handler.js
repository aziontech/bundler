import { mountSSG, ErrorHTML } from "#edge";

try {
  const myApp = await mountSSG(event.request.url, AZION_VERSION_ID);
  return myApp;
} catch (error) {
  return ErrorHTML("404");
}