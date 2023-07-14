import { mountSPA,debugRequest, ErrorHTML } from '#edge';

try {
  debugRequest(event)
  const myApp = await mountSPA(event.request.url, AZION.VERSION_ID);
  return myApp;
} catch (e) {
  return ErrorHTML('404');
}
