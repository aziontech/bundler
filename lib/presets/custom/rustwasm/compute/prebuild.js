import { rm } from 'fs/promises';
import { exec, generateManifest } from '#utils';

const manifest = {
  rules: {
    request: [
      {
        name: 'Main_Rule',
        match: '^\\/',
        runFunction: {
          path: '.edge/worker.js',
        },
      },
    ],
  },
};

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

  await generateManifest(manifest);
}

export default prebuild;
