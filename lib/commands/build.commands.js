import { feedback } from '#utils';

/**
 *
 * @param options
 * @param options.entry
 * @param options.preset
 * @param options.mode
 * @param options.useNodePolyfills
 */
async function buildCommand({
  entry, preset, mode, useNodePolyfills,
}) {
  let entryPoint = null;

  if (preset === 'javascript') {
    entryPoint = entry;
    feedback.info('Using main.js as entrypoint by default');
  }
  if (preset === 'typescript') {
    if (entry) { entryPoint = entry; }
    feedback.info('Using main.ts as entrypoint by default');
    if (!entry) { entryPoint = './main.ts'; }
  }

  const BuildDispatcher = (await import('#build')).default;
  const buildDispatcher = new BuildDispatcher(
    preset,
    mode,
    entryPoint,
    useNodePolyfills,
  );

  await buildDispatcher.run();
}

export default buildCommand;
