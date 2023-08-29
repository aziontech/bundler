import { join } from 'path';

/**
 *
 */
async function storageCommand() {
  const { core } = await import('#platform');
  const { getVulcanBuildId } = await import('#utils');

  const versionId = getVulcanBuildId();
  const basePath = join(process.cwd(), '.edge/storage/');
  await core.actions.uploadStatics(versionId, basePath);
}

export default storageCommand;
