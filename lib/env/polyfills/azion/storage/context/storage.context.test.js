/* eslint-disable */
import fs from 'fs';
import { Readable } from 'stream';
import tmp from 'tmp';
import StorageContext from './storage.context.js';

describe('StorageContext', () => {
  const bucketName = 'testBucket';
  const metadataPrefix = `.metadata-${bucketName}.json`;
  let storageContext;
  let tmpDir;

  function createTmpBucket(bucketName) {
    const tmpDirEdge = tmp.dirSync({
      name: '.edge',
      unsafeCleanup: true,
    });
    const tmpDirStorage = tmp.dirSync({
      name: 'storage',
      dir: tmpDirEdge.name,
      unsafeCleanup: true,
    });
    const tmpDirBucket = tmp.dirSync({
      name: bucketName,
      dir: tmpDirStorage.name,
      unsafeCleanup: true,
    });
    return { tmpDirEdge, tmpDirStorage, tmpDirBucket };
  }

  function createReadableStream(str) {
    const stream = new Readable();
    stream.push(str);
    stream.push(null);
    return stream;
  }

  beforeEach(() => {
    tmpDir = createTmpBucket(bucketName);
    storageContext = new StorageContext(bucketName, tmpDir.tmpDirBucket.name);
  });

  afterEach(() => {
    tmpDir.tmpDirBucket.removeCallback();
    tmpDir.tmpDirStorage.removeCallback();
    tmpDir.tmpDirEdge.removeCallback();
  });

  describe('get', () => {
    it('should retrieve the content of an existing object', async () => {
      const key = 'existingKey.txt';
      const content = 'Hello, Storage!';
      const metadata = {
        contentType: 'text/plain',
        contentLength: content.length,
        metadata: { someMetadata: 'value' },
      };

      await fs.promises.writeFile(
        `${tmpDir.tmpDirBucket.name}/${key}`,
        Buffer.from(content),
      );
      await fs.promises.writeFile(
        `${tmpDir.tmpDirBucket.name}/${key}${metadataPrefix}`,
        Buffer.from(JSON.stringify(metadata)),
      );

      const result = await storageContext.get(key);
      expect(result.contentRid).toEqual(Buffer.from(content));
      expect(result.contentType).toEqual('text/plain');
      expect(result.contentLength).toEqual(content.length);
      expect(result.metadata).toEqual(metadata.metadata);
    });

    it('should throw an error when trying to retrieve a non-existing object', async () => {
      const key = 'nonExistingKey';
      await expect(storageContext.get(key)).rejects.toThrow();
    });
  });

  describe('put', () => {
    it('should store a key-value pair in the storage', async () => {
      const key = 'newKey.txt';
      const value = 'Hello, Storage!';
      const options = {
        'content-type': 'text/plain',
        'content-length': value.length,
        metadata: { someMetadata: 'value' },
      };

      const readableStream = createReadableStream(value);

      await storageContext.put(key, readableStream, options);

      const result = await storageContext.get(key);
      expect(result.contentRid).toEqual(Buffer.from(value));
      expect(result.contentType).toEqual('text/plain');
      expect(result.contentLength).toEqual(value.length);
      expect(result.metadata).toEqual(options.metadata);
    });

    it('should store a Readable stream as the value', async () => {
      const key = 'streamKey';
      const value = createReadableStream('Hello, Storage!');
      const options = {
        'content-type': 'text/plain',
        metadata: { someMetadata: 'value' },
      };

      await storageContext.put(key, value, options);

      const result = await storageContext.get(key);
      expect(result.contentRid).toEqual(Buffer.from('Hello, Storage!'));
      expect(result.contentType).toEqual('text/plain');
      expect(result.metadata).toEqual(options.metadata);
    });
  });

  describe('delete', () => {
    it('should delete an existing object', async () => {
      const key = 'existingKey.txt';
      const content = 'Hello, Storage!';
      const metadata = {
        contentType: 'text/plain',
        contentLength: content.length,
        metadata: { someMetadata: 'value' },
      };

      await fs.promises.writeFile(
        `${tmpDir.tmpDirBucket.name}/${key}`,
        Buffer.from(content),
      );
      await fs.promises.writeFile(
        `${tmpDir.tmpDirBucket.name}/${key}${metadataPrefix}`,
        Buffer.from(JSON.stringify(metadata)),
      );

      await storageContext.delete(key);

      await expect(storageContext.get(key)).rejects.toThrow();
    });

    it('should throw an error when trying to delete a non-existing object', async () => {
      const key = 'nonExistingKey.txt';
      await expect(storageContext.delete(key)).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list objects in the storage', async () => {
      const objects = ['object1.txt', 'object2.txt', 'object3.txt'];
      for (const objectKey of objects) {
        await fs.promises.writeFile(
          `${tmpDir.tmpDirBucket.name}/${objectKey}`,
          'Hello, Storage!',
        );
        await fs.promises.writeFile(
          `${tmpDir.tmpDirBucket.name}/${objectKey}${metadataPrefix}`,
          Buffer.from(JSON.stringify({ contentType: 'text/plain' })),
        );
      }

      const result = await storageContext.list();

      const resultKeys = result.key_list.map((entry) => entry.key);
      expect(resultKeys).toEqual(expect.arrayContaining(objects));
    });

    it('should list objects in storage that are in subdirectories', async () => {
      const subdir = 'hello';
      const objectsKeys = ['object1.txt', 'object2.txt'];
      const objects = ['hello/object1.txt', 'hello/object2.txt'];
      for (const objectKey of objectsKeys) {
        await fs.promises.mkdir(`${tmpDir.tmpDirBucket.name}/${subdir}`, {
          recursive: true,
        });
        await fs.promises.writeFile(
          `${tmpDir.tmpDirBucket.name}/${subdir}/${objectKey}`,
          'Hello, Storage!',
        );
        await fs.promises.writeFile(
          `${tmpDir.tmpDirBucket.name}/${objectKey}${metadataPrefix}`,
          Buffer.from(JSON.stringify({ contentType: 'text/plain' })),
        );
      }

      const result = await storageContext.list();

      const resultKeys = result.key_list.map((entry) => entry.key);
      expect(resultKeys).toEqual(expect.arrayContaining(objects));
    });

    it('should return an empty list when there are no objects in the storage', async () => {
      const result = await storageContext.list();

      expect(result.key_list).toHaveLength(0);
    });
  });
});
