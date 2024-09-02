/* eslint-disable */
import init, * as WasmModule from './.wasm-bindgen/azion_rust_edge_function';
import wasmData from './.wasm-bindgen/azion_rust_edge_function_bg.wasm';

let wasmPromise = null;

/**
 * Handles the 'fetch' event.
 * @param {import('azion/types').FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handler(event) {
  try {
    if (!wasmPromise) {
      wasmPromise = fetch(wasmData).then((response) =>
        init(response.arrayBuffer()),
      );
    }
    return wasmPromise.then(() => WasmModule.fetch_listener(event));
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
}

export default handler;
