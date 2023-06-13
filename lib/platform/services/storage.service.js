import BaseService from './base.service.js';

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
    super('https://storage-api.azion.com/storage');
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

// Singleton pattern
export default new StorageService();
