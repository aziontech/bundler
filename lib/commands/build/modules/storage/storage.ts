import { debug } from '#utils';
import fsPromises from 'fs/promises';
import path from 'path';
import { AzionConfig, AzionBucket } from 'azion/config';
import { DIRECTORIES } from '#constants';

interface StorageMetadata {
  name: string;
  edgeAccess: 'read_only' | 'read_write' | 'restricted';
  sourceDir: string;
  targetDir: string;
  createdAt: string;
}

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
const saveStorageMetadata = async (
  storageName: string,
  metadata: Omit<StorageMetadata, 'createdAt'>,
): Promise<void> => {
  try {
    const metadataPath = path.join(DIRECTORIES.OUTPUT_STORAGE_PATH, `${storageName}.metadata.json`);
    const fullMetadata: StorageMetadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
    };

    await fsPromises.writeFile(metadataPath, JSON.stringify(fullMetadata, null, 2), 'utf-8');
    debug.info(`Storage metadata saved for: ${storageName}`);
  } catch (error) {
    debug.error(`Failed to save storage metadata for ${storageName}:`, error);
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
): Promise<void> => {
  try {
    const targetPath = path.join(targetDir, storage.name);

    // Remove existing symlink if it exists
    try {
      await fsPromises.unlink(targetPath);
      debug.info(`Removed existing storage link: ${targetPath}`);
    } catch (error) {
      // Ignore error if file doesn't exist
      debug.warn(`Storage link not found: ${targetPath}`);
    }

    // Create the symbolic link
    await fsPromises.symlink(sourceDir, targetPath, 'dir');
    debug.info(`Storage link created: ${storage.name} -> ${sourceDir}`);

    // Save storage metadata
    await saveStorageMetadata(storage.name, {
      name: storage.name,
      edgeAccess: storage.edgeAccess || 'read_only',
      sourceDir,
      targetDir: targetPath,
    });
  } catch (error) {
    debug.error(`Failed to create storage link for ${storage.name}:`, error);
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
export const setupStorage = async ({ config }: { config: AzionConfig }): Promise<void> => {
  try {
    const storages = config.edgeStorage || [];

    if (storages.length === 0) {
      debug.info('No storages found to setup');
      return;
    }

    // Ensure base storage directory exists
    await fsPromises.mkdir(DIRECTORIES.OUTPUT_STORAGE_PATH, { recursive: true });

    for (const storage of storages) {
      if (!validateStorageConfig(storage)) {
        continue;
      }

      const sourceDir = path.resolve(process.cwd(), storage.dir);

      // Validate if source directory exists
      if (!(await directoryExists(sourceDir))) {
        throw new Error(`Storage directory not found: ${sourceDir}`);
      }

      // Create symbolic link for storage
      await createStorageSymlink(storage, sourceDir, DIRECTORIES.OUTPUT_STORAGE_PATH);
    }

    debug.info('Storage setup completed successfully');
  } catch (error) {
    debug.error('Failed to setup storages:', error);
    throw error;
  }
};
