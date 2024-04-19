import { Services } from '#namespaces';
import BaseService from './base.service.js';

const env = globalThis.vulcan?.env ? globalThis.vulcan.env : 'production';
const API = {
  stage: 'https://stage-storage-api.azion.com',
  production: 'https://storage-api.azion.com',
};

/**
 * Service for interacting with the Azion Storage API.
 * Extends the BaseService class.
 */
class StorageService extends BaseService {
  /**
   * Constructs a new instance of the StorageService.
   * Sets the base URL for the Storage API.
   */
  constructor() {
    super(`${API[env]}/storage`);
  }

  /**
   * Uploads a file to the specified version ID in the storage API.
   * @param {string} versionId - The version ID for the file.
   * @param {string} file - The file content as a String.
   * @param {string} staticPath - The static path for the asset.
   * @param {string} contentType - The content type of the file.
   * @returns {Promise} A promise that resolves with the API response.
   */
  async upload(versionId, file, staticPath, contentType) {
    return super.post(`${versionId}`, file, {
      headers: {
        'X-Azion-Static-Path': staticPath,
        'Content-Type': contentType,
      },
    });
  }
}

/**
 * @name StorageService
 * @memberof Services
 * Instance of the Storage Service.
 * This instance provides methods to interact with the Azion Storage API,
 * such as uploading files to the storage.
 * @type {BaseService}
 * @function StorageService.upload
 * @example
 *
 * // Example usage
 * const versionId = '12345';
 * const fileContent = '...'; // File content as a string
 * const staticPath = '/assets/images/';
 * const contentType = 'text/javascript';
 *
 * StorageService.upload(versionId, fileContent, staticPath, contentType)
 *   .then((response) => {
 *     console.log(response);
 *   })
 *   .catch((error) => {
 *     feedback.error(error);
 *   });
 */
const StorageServiceInstance = new StorageService();
export default StorageServiceInstance;
