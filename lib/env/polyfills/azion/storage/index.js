/* eslint-disable */

const PRIVATE_CONSTRUCTOR = Symbol('PRIVATE_CONSTRUCTOR');
export default class Storage {
  #bucketName;
  constructor(bucketName) {
    if (typeof bucketName !== 'string') {
      throw new Error('bucketName must be a string');
    }
    this.#bucketName = bucketName;
  }

  async get(key, options) {
    const asset = await new STORAGE_CONTEXT(this.#bucketName).get(key, options);
    return new StorageObject(asset, PRIVATE_CONSTRUCTOR);
  }

  async put(key, value, options) {
    const asset = await new STORAGE_CONTEXT(this.#bucketName).put(
      key,
      value,
      options,
    );
    return new StorageObject(asset, PRIVATE_CONSTRUCTOR);
  }

  async delete(key) {
    return await new STORAGE_CONTEXT(this.#bucketName).delete(key);
  }

  async list(path) {
    let asset_list = await new STORAGE_CONTEXT(this.#bucketName).list();
    return new StorageObjectList(asset_list?.key_list, PRIVATE_CONSTRUCTOR);
  }
}

export class StorageObject {
  #metadata;
  #contentType;
  #contentLength;
  #content;
  constructor(asset, privateConstructor) {
    if (privateConstructor !== PRIVATE_CONSTRUCTOR) {
      throw new Error('StorageObject constructor is private.');
    }
    let { contentRid, contentLength, contentType, metadata } = asset;

    this.#content = contentRid;
    this.#contentLength = contentLength;

    if (metadata === null) {
      // if metadata is null, set it to an empty Map.
      this.#metadata = new Map();
    } else {
      this.#metadata = new Map(Object.entries(metadata));
    }
    this.#contentType = contentType;
  }
  get content() {
    return this.#content.toString();
  }
  async arrayBuffer() {
    return this.#content;
  }
  get metadata() {
    return this.#metadata;
  }
  get contentType() {
    return this.#contentType;
  }
  get contentLength() {
    return this.#contentLength;
  }
}

export class StorageObjectList {
  entries;

  constructor(list, privateConstructor) {
    if (privateConstructor !== PRIVATE_CONSTRUCTOR) {
      throw new Error('StorageObjectList constructor is private.');
    }
    this.entries = list;
  }
}
