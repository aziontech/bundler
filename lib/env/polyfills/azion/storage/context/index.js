/* eslint-disable */
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { pipeline } from 'stream/promises';

class StorageContext {
  #pathBucket;
  constructor(bucketName, storagePath) {
    this.bucketName = bucketName;
    const _storagePath = storagePath || '.edge/storage';
    this.#pathBucket = `${_storagePath}/${bucketName}`;
  }

  async get(key, options) {
    try {
      const item = await fs.promises.readFile(`${this.#pathBucket}/${key}`);
      return StorageContext.makeAsset(key, item);
    } catch (error) {
      throw error;
    }
  }

  async put(key, value, options) {
    try {
      const prefix = path.dirname(key);
      await fs.promises.mkdir(`${this.#pathBucket}${prefix}`, {
        recursive: true,
      });

      if (value instanceof ReadableStream) {
        const writeStream = fs.createWriteStream(`${this.#pathBucket}${key}`);
        await pipeline(value, writeStream);
      } else {
        await fs.promises.writeFile(`${this.#pathBucket}${key}`, value);
      }
      return StorageContext.makeAsset(key, value);
    } catch (error) {
      throw error;
    }
  }

  async delete(key) {
    try {
      return await fs.promises.rm(`${this.#pathBucket}/${key}`);
    } catch (error) {
      throw error;
    }
  }

  async list() {
    const pathBucketRoot = `${this.#pathBucket}/`;
    try {
      const files = await fs.promises.readdir(pathBucketRoot);
      const paths = files.map((file) => {
        return { key: path.join(pathBucketRoot, file) };
      });
      return { key_list: paths };
    } catch (error) {
      throw error;
    }
  }

  static makeAsset(key, file) {
    const contentType = mime.lookup(key) || 'application/octet-stream';
    const contentLength = file.length;
    const metadata = {};
    return { contentRid: file, contentType, contentLength, metadata };
  }
}

export default StorageContext;
