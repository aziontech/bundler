import { mkdir } from 'fs/promises';
import { exec } from '#utils';

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
// eslint-disable-next-line
async function prebuild(buildContext) {
  const optimizationLevel = '2';
  const wasmEnabled = '1';
  const asyncify = '1';
  const exportedRuntimeMethods = '\'["cwrap", "setValue"]\'';
  const exportedFunctions = '\'["_fetch_listener"]\'';
  const allowMemoryGrowth = '1';
  const dynamicExecution = '0';
  const textDecoder = '0';
  const modularize = '1';
  const environment = 'web';
  const exportName = '"createModule"';
  const singleFile = '1';
  const output = './build/module';
  const input = './src/main.cpp';
  const libraries = '-lembind';

  await mkdir('./build', { recursive: true });

  const command = [
    'emcc',
    `-O${optimizationLevel}`,
    `-s WASM=${wasmEnabled}`,
    `-s ASYNCIFY=${asyncify}`,
    `-s EXPORTED_RUNTIME_METHODS=${exportedRuntimeMethods}`,
    `-s EXPORTED_FUNCTIONS=${exportedFunctions}`,
    `-s ALLOW_MEMORY_GROWTH=${allowMemoryGrowth}`,
    `-s DYNAMIC_EXECUTION=${dynamicExecution}`,
    `-s TEXTDECODER=${textDecoder}`,
    `-s MODULARIZE=${modularize}`,
    `-s ENVIRONMENT=${environment}`,
    `-s EXPORT_NAME="${exportName}"`,
    `-s SINGLE_FILE=${singleFile}`,
    libraries,
    `-o ${output}`,
    input,
  ].join(' ');

  await exec(command);
}

export default prebuild;
