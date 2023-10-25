import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { promisify } from 'util';

import { feedback, debug } from '#utils';
import { Messages } from '#constants';
import { Platform } from '#namespaces';
import StorageService from '../../services/storage.service.js';

/**
 * @function
 * @memberof Platform
 * @description Uploads files to the storage. This function recursively navigates
 * through the directory structure from the specified base path and uploads all the files
 * it encounters. It counts the successful uploads and provides feedback on each file upload status.
 * @param {string} versionId - The ID of the version to which the files are to be uploaded.
 * @param {string} basePath - The base path from where files to upload are located.
 * @param {string} [currentPath] - The current path being processed, used for recursive calls.
 * Defaults to an empty string.
 * @returns {Promise<number>} A promise that resolves with the total number of files
 *  uploaded successfully.
 * @throws Will throw an error if there's a problem reading files or directories,
 * or uploading a file.
 * @example
 * try {
 *    const totalUploaded = await uploadStatics('version123', './path/to/files');
 *    console.log(`Total files uploaded: ${totalUploaded}`);
 * } catch (error) {
 *    console.error(error);
 * }
 */
async function uploadStatics(versionId, basePath, currentPath = '') {
  let successUploadCount = 0;
  /**
   * Uploads files recursively to the storage.
   * @param {string} filePath - The file path.
   * @returns {Promise<void>} A Promise that resolves when the file is uploaded.
   */
  async function uploadFiles(filePath) {
    const fullFilePath = path.join(basePath, filePath);
    const fileStat = await promisify(fs.stat)(fullFilePath);

    if (fileStat.isFile()) {
      const fileContent = await promisify(fs.readFile)(fullFilePath);
      const mimeType = mime.lookup(fullFilePath);
      const staticPath = path.join(currentPath, filePath).replace(/\\/g, '/');

      try {
        const response = await StorageService.upload(
          versionId,
          fileContent,
          staticPath,
          mimeType,
        );
        if (response.statusText === 'OK') {
          successUploadCount += 1;
          feedback.statics.success(
            Messages.platform.storage.success.file_uploaded_success(filePath),
          );
        }
        if (!response.status === 'OK') {
          throw new Error(response);
        }
      } catch (error) {
        feedback.statics.error(
          Messages.platform.storage.errors.file_upload_failed(filePath),
        );
        debug.error(error);
      }
    } else if (fileStat.isDirectory()) {
      const subDirPath = path.join(currentPath, filePath);
      const subDirFiles = await promisify(fs.readdir)(
        path.join(basePath, subDirPath),
      );

      await Promise.all(
        subDirFiles.map((file) => uploadFiles(path.join(subDirPath, file))),
      );
    }
  }

  try {
    const files = await promisify(fs.readdir)(path.join(basePath, currentPath));
    await Promise.all(files.map((file) => uploadFiles(file)));
  } catch (error) {
    debug.error(error);
    throw error;
  }

  feedback.statics.success(
    Messages.platform.storage.success.statics_uploaded_finish(
      successUploadCount,
    ),
  );
  return successUploadCount;
}

// eslint-disable-next-line import/prefer-default-export
export { uploadStatics };
