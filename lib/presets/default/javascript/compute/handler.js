import { debugRequest } from "#edge";
try {
  debugRequest(event)
  __JS_CODE__;
} catch (e) {
  return new Response(e.message || e.toString(), { status: 500 });
}
