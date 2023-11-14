import { rm, readFile } from 'fs/promises';
import { exec, getPackageManager, copyDirectory } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
// eslint-disable-next-line
async function prebuild(buildContext) {

    const pkg = '.wasm-bindgen';
    const target = 'target/wasm32-unknown-unknown/debug/azion_rust_edge_function.wasm';

    await rm(pkg, { recursive: true, force: true });

    await exec(`cargo build --target=wasm32-unknown-unknown`);
    await exec(`wasm-bindgen --out-dir=${pkg} --target=web --omit-default-module-path ${target}`);

}

export default prebuild;
