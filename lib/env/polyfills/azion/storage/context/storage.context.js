import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { pipeline } from 'stream/promises';

/**
 * A class representing a storage context with methods for interacting with stored data.
 * @class
 */
class StorageContext {
  #pathBucket;

  #metadataPrefix;

  /**
   * Creates an instance of StorageContext.
   * @class
   * @param {string} bucketName - The name of the storage bucket.
   * @param {string} [pathBucket] - The path to the storage bucket (defaults to `.edge/storage/{bucketName}`).
   */
  constructor(bucketName, pathBucket) {
    this.bucketName = bucketName;
    this.#pathBucket = pathBucket || `.edge/storage/${bucketName}`;
    this.#metadataPrefix = `.metadata-${bucketName}.json`;
  }

  /**
   * Retrieves the content of an existing object from the storage.
   * @async
   * @param {string} key - The key identifying the object.
   * @returns {Promise<object>} A promise that resolves to an object representing the retrieved data.
   * @throws {Error} Throws an error if the retrieval fails.
   */
  async get(key) {
    const item = await fs.promises.readFile(`${this.#pathBucket}/${key}`);

    const responseMetadata = await StorageContext.getMetadata(
      this.#pathBucket,
      key,
      this.#metadataPrefix,
    );

    return StorageContext.responseAsset(item, responseMetadata);
  }

  /**
   * Stores a object in the storage.
   * @async
   * @param {string} key - The key to store the value under.
   * @param {ReadableStream|string} value - The value to store (can be a ReadableStream or a string).
   * @param {object} options - Additional options for storing the object.
   * @returns {Promise<object>} A promise that resolves to an object representing the stored data.
   * @throws {Error} Throws an error if the storing process fails.
   */
  async put(key, value, options) {
    const prefix = path.dirname(key);
    await fs.promises.mkdir(`${this.#pathBucket}/${prefix}`, {
      recursive: true,
    });
    if (value instanceof ReadableStream) {
      const writeStream = fs.createWriteStream(`${this.#pathBucket}/${key}`);
      await pipeline(value, writeStream);
    } else {
      await fs.promises.writeFile(`${this.#pathBucket}/${key}`, value);
    }

    const responseMetadata = await StorageContext.putMetadata(
      this.#pathBucket,
      key,
      options,
      this.#metadataPrefix,
    );

    return StorageContext.responseAsset(value, responseMetadata);
  }

  /**
   * Deletes an object from the storage.
   * @async
   * @param {string} key - The key identifying the object to be deleted.
   * @returns {Promise<void>} A promise that resolves when the object is successfully deleted.
   * @throws {Error} Throws an error if the deletion process fails.
   */
  async delete(key) {
    return fs.promises.rm(`${this.#pathBucket}/${key}`);
  }

  /**
   * Lists objects in the storage, returning an array of key paths.
   * @async
   * @returns {Promise<object>} A promise that resolves to an object containing the list of key paths.
   * @throws {Error} Throws an error if the listing process fails.
   */
  async list() {
    const pathBucketRoot = `${this.#pathBucket}/`;
    const entries = await fs.promises.readdir(pathBucketRoot, {
      withFileTypes: true,
      recursive: true,
    });
    const files = entries
      .filter(
        (entry) => entry.isFile() && !entry.name.includes(this.#metadataPrefix),
      )
      .map((file) => {
        const pathFile = file.path?.split(pathBucketRoot)?.[1];
        const key = pathFile ? `${pathFile}/${file.name}` : file.name;
        return { key };
      });

    return { key_list: files };
  }

  /**
   * Generates a response object for the retrieved asset.
   * @static
   * @async
   * @param {ReadableStream|string} value - The value of the asset.
   * @param {object} metadataStore - Metadata associated with the asset.
   * @returns {Promise<object>} A promise that resolves to an object representing the response asset.
   */
  static async responseAsset(value, metadataStore) {
    const contentType = metadataStore?.contentType || null;
    const contentLength = metadataStore?.contentLength || null;
    const metadata = metadataStore?.metadata || null;

    return { contentRid: value, contentType, contentLength, metadata };
  }

  /**
   * Stores metadata for an object in the storage.
   * @static
   * @async
   * @param {string} pathBucket - The path to the storage bucket.
   * @param {string} key - The key identifying the object.
   * @param {object} options - Additional options for storing metadata.
   * @param {string} metadataPrefix - The prefix for metadata files.
   * @returns {Promise<object>} A promise that resolves to an object representing the stored metadata.
   */
  static async putMetadata(pathBucket, key, options, metadataPrefix) {
    const stats = await fs.promises.stat(`${pathBucket}/${key}`);
    const contentLength = options['content-length'] || stats?.size;
    const contentType = options['content-type'] || mime.lookup(key);

    const bodyMetadata = {
      contentType,
      contentLength,
      metadata: options?.metadata,
    };
    await fs.promises.writeFile(
      `${pathBucket}/${key}${metadataPrefix}`,
      JSON.stringify(bodyMetadata, undefined, 2),
    );
    return bodyMetadata;
  }

  /**
   * Retrieves metadata for an object from the storage.
   * @static
   * @async
   * @param {string} pathBucket - The path to the storage bucket.
   * @param {string} key - The key identifying the object.
   * @param {string} metadataPrefix - The prefix for metadata files.
   * @returns {Promise<object>} A promise that resolves to an object representing the retrieved metadata.
   */
  static async getMetadata(pathBucket, key, metadataPrefix) {
    try {
      let data = await fs.promises.readFile(
        `${pathBucket}/${key}${metadataPrefix}`,
      );
      data = JSON.parse(data.toString());
      return {
        contentType: data?.contentType,
        contentLength: data?.contentLength,
        metadata: data?.metadata,
      };
    } catch (error) {
      return {};
    }
  }
}

export default StorageContext;
