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
 * @returns {Promise<void>} A Promise that resolves when the upload is completed.
 */
async function uploadStatics(versionId, basePath, currentPath = '') {
  const files = await promisify(fs.readdir)(path.join(basePath, currentPath));

  await Promise.all(files.map(async (file) => {
    const filePath = path.join(currentPath, file);
    const fullFilePath = path.join(basePath, filePath);
    const fileStat = await promisify(fs.stat)(fullFilePath);

    if (fileStat.isFile()) {
      const fileContent = await promisify(fs.readFile)(fullFilePath, 'utf8');
      const mimeType = mime.lookup(fullFilePath);
      const staticPath = path.join(currentPath, file);

      try {
        const response = await StorageService.upload(versionId, fileContent, staticPath, mimeType);
        if (response.statusText === 'OK') { console.log(chalk.green(`Uploaded file: ${filePath}`)); }
        if (!response.status === 'OK') { throw new Error(response); }
      } catch (error) {
        console.log(chalk.red(`Error uploading file: ${filePath}`));
        console.error(error);
      }
    } else if (fileStat.isDirectory()) {
      await uploadStatics(versionId, basePath, filePath);
    }
  }));
}

// eslint-disable-next-line import/prefer-default-export
export { uploadStatics };
