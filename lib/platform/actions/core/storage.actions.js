import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { promisify } from 'util';
import { feedback, debug } from '#utils';
import { Messages } from '#constants';
import StorageService from '../../services/storage.service.js';

/**
 * Uploads files to the storage.
 * @param {string} versionId - The version ID.
 * @param {string} basePath - The base path of the files to upload.
 * @param {string} [currentPath] - The current path being processed (used for recursive calls).
 * @returns {Promise<number>} A Promise that resolves with the total number of files uploaded.
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
      const fileContent = await promisify(fs.readFile)(fullFilePath, 'utf8');
      const mimeType = mime.lookup(fullFilePath);
      const staticPath = path.join(currentPath, filePath);

      try {
        const response = await StorageService.upload(versionId, fileContent, staticPath, mimeType);
        if (response.statusText === 'OK') {
          successUploadCount += 1;
          feedback.statics.success(
            Messages.platform.storage.success.file_uploaded_success(filePath),
          );
        }
        if (!response.status === 'OK') { throw new Error(response); }
      } catch (error) {
        feedback.statics.error(Messages.platform.storage.errors.file_upload_failed(filePath));
        debug.error(error);
      }
    } else if (fileStat.isDirectory()) {
      const subDirPath = path.join(currentPath, filePath);
      const subDirFiles = await promisify(fs.readdir)(path.join(basePath, subDirPath));

      await Promise.all(subDirFiles.map((file) => uploadFiles(path.join(subDirPath, file))));
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
    Messages.platform.storage.success.statics_uploaded_finish(successUploadCount),
  );
  return successUploadCount;
}

// eslint-disable-next-line import/prefer-default-export
export { uploadStatics };
