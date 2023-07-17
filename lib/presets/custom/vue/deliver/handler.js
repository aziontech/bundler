import { mountSPA, ErrorHTML } from "#edge";

try {
  const myApp = await mountSPA(event.request.url, AZION_VERSION_ID);
  return myApp;
} catch (e) {
  return ErrorHTML("404");
}
