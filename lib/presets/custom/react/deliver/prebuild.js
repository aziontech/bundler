import { exec, getPackageManager, generateManifest } from '#utils';

const packageManager = await getPackageManager();

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
        name: 'Main_Rule',
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
 */
async function prebuild() {
  await exec(
    `BUILD_PATH="./.edge/storage" ${packageManager} run build`,
    'React',
    true,
  );
  await generateManifest(manifest);
}

export default prebuild;
