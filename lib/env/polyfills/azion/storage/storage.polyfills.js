/* eslint-disable */

/**
 * Storage API Polyfill
 * This polyfill is referenced in #build/bundlers/polyfills/polyfills-manager.js
 *
 * * @example
 *
 *  const storage = new Storage("mybucketname");
 *  const asset = await storage.get(key);
 */

const PRIVATE_CONSTRUCTOR = Symbol('PRIVATE_CONSTRUCTOR');

/**
 * Class representing a storage container.
 * @class
 */
export default class Storage {
  #bucketName;

  /**
   * Creates an instance of Storage.
   * @constructor
   * @param {string} bucketName - The name of the storage bucket.
   * @throws {Error} Throws an error if bucketName is not a string.
   */
  constructor(bucketName) {
    if (typeof bucketName !== 'string') {
      throw new Error('bucketName must be a string');
    }
    /**
     * The name of the storage bucket.
     * @private
     * @type {string}
     */
    this.#bucketName = bucketName;
  }

  /**
   * Retrieves the content of a stored object.
   * @async
   * @param {string} key - The key of the object to retrieve.
   * @returns {Promise<StorageObject>} A promise that resolves to a StorageObject representing the retrieved object.
   */
  async get(key) {
    const asset = await new STORAGE_CONTEXT(this.#bucketName).get(key);
    return new StorageObject(asset, PRIVATE_CONSTRUCTOR);
  }

  /**
   * Stores a key-value pair in the storage.
   * @async
   * @param {string} key - The key under which to store the value.
   * @param {any} value - The value to store.
   * @param {Object} options - Additional options for the operation.
   * @returns {Promise<StorageObject>} A promise that resolves to a StorageObject representing the stored object.
   */
  async put(key, value, options) {
    const asset = await new STORAGE_CONTEXT(this.#bucketName).put(
      key,
      value,
      options,
    );
    return new StorageObject(asset, PRIVATE_CONSTRUCTOR);
  }

  /**
   * Deletes an object from the storage.
   * @async
   * @param {string} key - The key of the object to delete.
   * @returns {Promise<void>} A promise that resolves when the object is successfully deleted.
   */
  async delete(key) {
    return await new STORAGE_CONTEXT(this.#bucketName).delete(key);
  }

  /**
   * Lists objects in the storage under a specified path.
   * @async
   * @param {string} path - The path under which to list objects.
   * @returns {Promise<StorageObjectList>} A promise that resolves to a StorageObjectList representing the list of objects.
   */
  async list(path) {
    let asset_list = await new STORAGE_CONTEXT(this.#bucketName).list();
    return new StorageObjectList(asset_list?.key_list, PRIVATE_CONSTRUCTOR);
  }
}

/**
 * Class representing a storage object.
 * @class
 */
export class StorageObject {
  #metadata;
  #contentType;
  #contentLength;
  #content;
  /**
   * Creates an instance of StorageObject.
   * @constructor
   * @param {Object} asset - The asset data representing the storage object.
   * @param {Symbol} privateConstructor - Symbol used for private constructor validation.
   * @throws {Error} Throws an error if the constructor is not called with the privateConstructor symbol.
   */
  constructor(asset, privateConstructor) {
    if (privateConstructor !== PRIVATE_CONSTRUCTOR) {
      throw new Error('StorageObject constructor is private.');
    }
    /**
     * The content ID of the storage object.
     * @private
     * @type {string}
     */
    this.#content = asset.contentRid;

    /**
     * The length of the content in the storage object.
     * @private
     * @type {number}
     */
    this.#contentLength = asset?.contentLength;

    /**
     * The metadata associated with the storage object.
     * @private
     * @type {Map<string, any>}
     */
    this.#metadata =
      asset.metadata === null
        ? new Map()
        : new Map(Object.entries(asset.metadata));

    /**
     * The content type of the storage object.
     * @private
     * @type {string}
     */
    this.#contentType = asset?.contentType;
  }

  /**
   * Gets the content of the storage object as a string.
   * @type {string}
   */
  get content() {
    return this.#content.toString();
  }

  /**
   * Retrieves the content of the storage object as an ArrayBuffer.
   * @async
   * @returns {Promise<ArrayBuffer>} A promise that resolves to an ArrayBuffer containing the content of the storage object.
   */
  async arrayBuffer() {
    return this.#content;
  }

  /**
   * Gets the metadata associated with the storage object.
   * @type {Map<string, any>}
   */
  get metadata() {
    return this.#metadata;
  }

  /**
   * Gets the content type of the storage object.
   * @type {string}
   */
  get contentType() {
    return this.#contentType;
  }

  /**
   * Gets the content length of the storage object.
   * @type {number}
   */
  get contentLength() {
    return this.#contentLength;
  }
}

/**
 * Class representing a list of storage objects.
 * @class
 */
export class StorageObjectList {
  /**
   * Creates an instance of StorageObjectList.
   * @constructor
   * @param {Array<string>} list - The list of storage object keys.
   * @param {Symbol} privateConstructor - Symbol used for private constructor validation.
   * @throws {Error} Throws an error if the constructor is not called with the privateConstructor symbol.
   */
  constructor(list, privateConstructor) {
    if (privateConstructor !== PRIVATE_CONSTRUCTOR) {
      throw new Error('StorageObjectList constructor is private.');
    }
    /**
     * The list of storage object keys.
     * @type {Array<string>}
     */
    this.entries = list;
  }
}
