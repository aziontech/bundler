import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { promisify } from 'util';
import chalk from 'chalk';
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
   *
   * @param filePath
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
          console.log(chalk.green(`Uploaded file: ${filePath}`));
        }
        if (!response.status === 'OK') { throw new Error(response); }
      } catch (error) {
        console.log(chalk.red(`Error uploading file: ${filePath}`));
        console.error(error);
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
    console.error(error);
    throw error;
  }

  console.log(chalk.rgb(255, 136, 0)(`🚀 ${successUploadCount} static assets successfully uploaded to Edge Storage!`));
  return successUploadCount;
}

// eslint-disable-next-line import/prefer-default-export
export { uploadStatics };
