import { generateManifest } from '#utils';

const manifest = {
  rules: {
    request: [
      {
        match: '^\\/',
        setOrigin: {
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
