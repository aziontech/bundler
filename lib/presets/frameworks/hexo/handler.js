import { mountSSG, ErrorHTML } from "#edge";

try {
  const myApp = await mountSSG(event.request.url, AZION.VERSION_ID);
  return myApp;
} catch (e) {
  return ErrorHTML("404");
}
