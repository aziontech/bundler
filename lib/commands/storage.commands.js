import { join } from 'path';

/**
 * A command to uploads static files for a given version of the application.
 * @memberof commands
 * The function identifies the build version, prepares a base path for static files,
 * and uploads these files to the storage of the core platform.
 * @returns {Promise<void>} - A promise that resolves when static files are successfully uploaded.
 * @example
 *
 * storageCommand();
 */
async function storageCommand() {
  const { core } = await import('#platform');
  const { getVulcanBuildId } = await import('#utils');

  const versionId = getVulcanBuildId();
  const basePath = join(process.cwd(), '.edge/storage/');
  await core.actions.uploadStatics(versionId, basePath);
}

export default storageCommand;
