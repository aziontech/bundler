import { rm } from 'fs/promises';
import { exec, copyDirectory, generateManifest } from '#utils';

const manifest = {
  origin: [
    {
      name: 'origin-storage-default',
      type: 'object_storage',
    },
  ],
  rules: {
    request: [
      {
        name: 'Main_Rule',
        match: '^\\/',
        setOrigin: {
          name: 'origin-storage-default',
          type: 'object_storage',
        },
      },
      {
        name: 'Index_Rewrite_1',
        match: '.*/$',
        // eslint-disable-next-line no-template-curly-in-string
        rewrite: {
          set: (uri) => `${uri}index.html`,
        },
      },
      {
        name: 'Index_Rewrite_2',
        match: '^(?!.*\/$)(?![\s\S]*\.[a-zA-Z0-9]+$).*',
        // eslint-disable-next-line no-template-curly-in-string
        rewrite: {
          set: (uri) => `${uri}index.html`,
        },
      },
    ],
  },
};

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';
  const outDir = '_site';

  await exec('npx @11ty/eleventy', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);

  await generateManifest(manifest);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
