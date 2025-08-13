import { debug } from '#utils';
import fsPromises from 'fs/promises';
import path from 'path';
import { AzionConfig, AzionBucket } from 'azion/config';
import { DIRECTORIES, MANIFEST_PLACEHOLDERS } from '#constants';
import { feedback } from 'azion/utils/node';

interface BucketMetadata {
  name: string;
  edgeAccess: 'read_only' | 'read_write' | 'restricted';
  sourceDir: string;
  targetDir: string;
  prefix: string;
  createdAt: string;
}

/**
 * Extends AzionBucket with processed prefix information
 */
export interface BucketSetup extends AzionBucket {
  prefix: string;
}

/**
 * Generates a timestamp-based prefix for storage
 */
const generateTimestampPrefix = (): string => {
  const timestamp = Date.now();
  return `${timestamp}`;
};

/**
 * Checks if a directory exists
 */
const directoryExists = async (dirPath: string): Promise<boolean> => {
  try {
    await fsPromises.access(dirPath);
    const stats = await fsPromises.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
};

/**
 * Saves storage metadata to a JSON file
 */
const saveBucketMetadata = async (
  storageName: string,
  metadata: Omit<BucketMetadata, 'createdAt'>,
): Promise<void> => {
  const placeholderBucketName = MANIFEST_PLACEHOLDERS.BUCKET_NAME;
  const storageNameDefault =
    placeholderBucketName === storageName ? MANIFEST_PLACEHOLDERS.BUCKET_NAME_DEFAULT : storageName;
  try {
    const metadataPath = DIRECTORIES.OUTPUT_STORAGE_METADATA_PATH;

    let allMetadata: BucketMetadata[] = [];
    try {
      const existingData = await fsPromises.readFile(metadataPath, 'utf-8');
      allMetadata = JSON.parse(existingData);
    } catch (error) {
      debug.info('Creating new storage metadata file');
    }

    const fullMetadata: BucketMetadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
    };

    allMetadata = allMetadata.filter((item) => item.name !== storageNameDefault);

    allMetadata.push(fullMetadata);

    await fsPromises.writeFile(metadataPath, JSON.stringify(allMetadata, null, 2), 'utf-8');
    debug.info(`Storage metadata saved for: ${storageNameDefault}`);
  } catch (error) {
    debug.error(`Failed to save storage metadata for ${storageNameDefault}:`, error);
    throw error;
  }
};

/**
 * Creates a symbolic link for the storage directory
 */
const createStorageSymlink = async (
  storage: AzionBucket,
  sourceDir: string,
  targetDir: string,
  prefix: string,
): Promise<void> => {
  const placeholderBucketName = MANIFEST_PLACEHOLDERS.BUCKET_NAME;
  const storageName =
    placeholderBucketName === storage.name
      ? MANIFEST_PLACEHOLDERS.BUCKET_NAME_DEFAULT
      : storage.name;

  try {
    const targetPath = path.join(targetDir, storageName);

    try {
      await fsPromises.unlink(targetPath);
      debug.info(`Removed existing storage link: ${targetPath}`);
    } catch (error) {
      debug.warn(`Storage link not found: ${targetPath}`);
    }

    await fsPromises.symlink(sourceDir, targetPath, 'dir');
    debug.info(`Storage link created: ${storageName} -> ${sourceDir}`);

    await saveBucketMetadata(storageName, {
      name: storageName,
      edgeAccess: storage.edgeAccess || 'read_only',
      sourceDir,
      targetDir: targetPath,
      prefix,
    });
  } catch (error) {
    debug.error(`Failed to create storage link for ${storageName}:`, error);
    throw error;
  }
};

/**
 * Validates storage configuration
 */
const validateStorageConfig = (storage: AzionBucket): boolean => {
  if (!storage.name || !storage.dir) {
    debug.warn('Storage configuration is missing required fields (name or dir)');
    return false;
  }
  return true;
};

/**
 * Sets up virtual local storages based on Azion configuration
 */
export const setupStorage = async ({ config }: { config: AzionConfig }): Promise<BucketSetup[]> => {
  try {
    const storages = config.edgeStorage || [];
    const processedStorages: BucketSetup[] = [];

    if (storages.length === 0) {
      debug.info('No storages found to setup');
      return processedStorages;
    }

    await fsPromises.mkdir(DIRECTORIES.OUTPUT_STORAGE_PATH, { recursive: true });

    for (const storage of storages) {
      if (!validateStorageConfig(storage)) {
        continue;
      }

      const sourceDir = path.resolve(process.cwd(), storage.dir);

      if (!(await directoryExists(sourceDir))) {
        throw new Error(`Storage directory not found: ${sourceDir}`);
      }

      const providedPrefix = (storage as BucketSetup).prefix;
      const prefix = providedPrefix || generateTimestampPrefix();

      if (!providedPrefix) {
        feedback.storage.info(
          `No prefix provided for storage '${storage.name}', generating version prefix: ${prefix}`,
        );
      }
      if (providedPrefix) {
        feedback.storage.info(`Using provided prefix for storage '${storage.name}': ${prefix}`);
      }

      await createStorageSymlink(storage, sourceDir, DIRECTORIES.OUTPUT_STORAGE_PATH, prefix);

      processedStorages.push({
        ...storage,
        prefix,
      });
    }

    debug.info('Storage setup completed successfully');
    return processedStorages;
  } catch (error) {
    debug.error('Failed to setup storages:', error);
    throw error;
  }
};
