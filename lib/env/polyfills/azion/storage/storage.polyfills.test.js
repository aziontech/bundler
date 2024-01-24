/* eslint-disable */
import Storage from './storage.polyfills.js';
import StorageContext from './context/storage.context.js';

jest.mock('./context/index.js');
global.STORAGE_CONTEXT = StorageContext;

describe('Storage API Polyfill', () => {
  const bucketName = 'testBucketStorage';
  let storage;

  beforeEach(() => {
    jest.clearAllMocks();

    storage = new Storage(bucketName);
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

      jest.spyOn(StorageContext.prototype, 'get').mockResolvedValueOnce({
        contentRid: Buffer.from(content),
        contentType: 'text/plain',
        contentLength: content.length,
        metadata: metadata.metadata,
      });

      const result = await storage.get(key);
      const metadataObject = Object.fromEntries(result.metadata);
      expect(result.content).toEqual(content);
      expect(result.contentType).toEqual('text/plain');
      expect(result.contentLength).toEqual(content.length);
      expect(metadataObject).toMatchObject(metadata.metadata);
    });

    it('should throw an error when trying to retrieve a non-existing object', async () => {
      const key = 'nonExistingKey';
      await expect(storage.get(key)).rejects.toThrow();
    });
  });

  describe('put', () => {
    it('should store a key-value pair in the storage', async () => {
      const key = 'newKey.txt';
      const value = 'Hello, New Storage!';
      const options = { someOption: 'value' };
      const content = Buffer.from(value);
      const metadata = {
        contentType: 'text/plain',
        contentLength: content.length,
        metadata: { someMetadata: 'value' },
      };

      jest.spyOn(StorageContext.prototype, 'put').mockResolvedValueOnce({
        contentRid: content,
        contentType: 'text/plain',
        contentLength: content.length,
        metadata: metadata.metadata,
      });

      const result = await storage.put(key, value, options);
      const metadataObject = Object.fromEntries(result.metadata);

      expect(result.content).toEqual(content.toString());
      expect(result.contentType).toEqual('text/plain');
      expect(result.contentLength).toEqual(content.length);
      expect(metadataObject).toMatchObject(metadata.metadata);
    });
  });

  describe('delete', () => {
    it('should delete an object from the storage', async () => {
      const key = 'existingKey.txt';

      jest.spyOn(StorageContext.prototype, 'delete').mockResolvedValueOnce();

      await expect(storage.delete(key)).resolves.toBeUndefined();
    });
  });

  describe('list', () => {
    it('should list objects in the storage under a specified path', async () => {
      const path = 'somePath';
      const keyList = ['file1.txt', 'file2.txt'];

      jest.spyOn(StorageContext.prototype, 'list').mockResolvedValueOnce({
        key_list: keyList,
      });

      const result = await storage.list(path);

      expect(result.entries).toEqual(keyList);
    });
  });
});
