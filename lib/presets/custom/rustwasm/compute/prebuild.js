import { rm } from 'fs/promises';
import { exec, Manifest } from '#utils';

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
// eslint-disable-next-line
async function prebuild(buildContext) {
  const pkg = '.wasm-bindgen';
  const target =
    'target/wasm32-unknown-unknown/debug/azion_rust_edge_function.wasm';

  await rm(pkg, { recursive: true, force: true });

  await exec(`cargo build --target=wasm32-unknown-unknown`);
  await exec(
    `wasm-bindgen --out-dir=${pkg} --target=web --omit-default-module-path ${target}`,
  );

  Manifest.setRoute({
    from: '/',
    to: '.edge/worker.js',
    priority: 1,
    type: 'compute',
  });
  Manifest.generate();
}

export default prebuild;
