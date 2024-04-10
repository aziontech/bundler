import { generateManifest } from '#utils';

const manifest = {
  origin: [
    {
      name: 'origin_storage_default',
      type: 'object_storage',
    },
  ],
  rules: {
    request: [
      {
        match: '^\\/',
        setOrigin: {
          name: 'origin_storage_default',
          type: 'object_storage',
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
  await generateManifest(manifest);
}

export default prebuild;
