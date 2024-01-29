import { readFileSync, writeFileSync } from 'fs';

import { feedback } from '#utils';

/**
 * Runs custom prebuild actions
 * @param {object} buildConfig - the build configuration
 */
// eslint-disable-next-line no-unused-vars
async function postbuild(buildConfig) {
  feedback.build.info('Fixing edge code...');

  const replacements = [
    // based on: https://github.com/cloudflare/next-on-pages/blob/main/packages/next-on-pages/src/buildApplication/processVercelFunctions/dedupeEdgeFunctions.ts#L462
    // TODO: This hack is not good. We should replace this with something less brittle ASAP
    // https://github.com/vercel/next.js/blob/2e7dfca362931be99e34eccec36074ab4a46ffba/packages/next/src/server/web/adapter.ts#L276-L282
    {
      file: '.edge/worker.js',
      pattern:
        /(Object.defineProperty\(globalThis,\s*"__import_unsupported",\s*{[\s\S]*?configurable:\s*)([^,}]*)(.*}\s*\))/gm,
      replacement: '$1true$3',
    },
  ];

  replacements.forEach(({ file, pattern, replacement }) => {
    let sourceCode = readFileSync(file, 'utf-8');
    sourceCode = sourceCode.replace(pattern, replacement);
    writeFileSync(file, sourceCode);
  });
}

export default postbuild;
