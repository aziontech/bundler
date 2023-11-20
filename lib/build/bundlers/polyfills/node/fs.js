/* eslint-disable max-classes-per-file */
import path from 'path-browserify';
import { Buffer } from 'buffer';

/* eslint-disable */

const MEM_FILES = globalThis.vulcan.__FILES__;

globalThis.vulcan.FS_PATHS_CHANGED = false;

/**
 * fix mapped files paths based on path prefix
 */
function fixMappedFilesPaths() {
  if (
    !globalThis.vulcan.FS_PATHS_CHANGED &&
    globalThis.vulcan.FS_PATH_PREFIX_TO_REMOVE !== ''
  ) {
    Object.keys(MEM_FILES).forEach((e) => {
      const newKey = e.replace(globalThis.vulcan.FS_PATH_PREFIX_TO_REMOVE, '');
      MEM_FILES[newKey] = MEM_FILES[e];
      delete MEM_FILES[e];
    });
  }

  globalThis.vulcan.FS_PATHS_CHANGED = true;
}

// ### fs polyfill utils
/**
 * Get file object stored in mem
 * @returns {any} file object
 */
function getFile(path) {
  fixMappedFilesPaths();

  return MEM_FILES[path];
}

/**
 * Decode file content to return
 * @returns {string|Buffer} the file content
 */
function getFileContent(file, returnBuffer = true) {
  const buff = Buffer.from(file.content, 'base64');

  if (returnBuffer) {
    return buff;
  } else {
    return buff.toString('utf8');
  }
}

/**
 * Get available files in worker memory
 * @returns {string[]} list of mapped files paths
 */
function getAvailableFiles() {
  if (MEM_FILES && typeof MEM_FILES === 'object') return Object.keys(MEM_FILES);

  return [];
}

/**
 * Get available dirs based on mapped files
 * @param {string[]} - files paths
 * @returns {string[]} - list of available dirs
 */
function getAvailableDirs(files) {
  if (files.length > 0) {
    const existingDirs = new Set();

    files.forEach((filePath) => {
      const dirPath = path.dirname(filePath);

      let currentPath = '/';
      let pathSegments = dirPath.split('/');
      for (let i = 0; i < pathSegments.length; i++) {
        currentPath = path.join(currentPath, pathSegments[i]);
        if (!existingDirs.has(currentPath)) {
          existingDirs.add(currentPath);
        }
      }
    });

    const dirs = Array.from(existingDirs);

    return dirs;
  }

  return [];
}

/**
 * Get mapped files infos
 * @returns {object} - object with files, dirs and paths
 */
function getFilesInfos() {
  fixMappedFilesPaths();

  const files = getAvailableFiles();
  const dirs = getAvailableDirs(files);

  return {
    files,
    dirs,
    paths: [...files, ...dirs],
  };
}

/**
 * Returns a valid path
 * @returns {string} - path to fix
 */
function getValidatedPath(path) {
  if (path.endsWith('/')) path = path.slice(0, -1);
  if (!path.startsWith('/')) path = `/${path}`;

  return path;
}

function generateDefaultStat() {
  const defaultDate = new Date();

  return {
    dev: 16777231,
    mode: 33188,
    nlink: 1,
    uid: 503,
    gid: 20,
    rdev: 0,
    blksize: 4096,
    ino: 99415867,
    size: 4037,
    blocks: 8,
    atimeMs: 1696531597782.944,
    mtimeMs: 1696531596158.1772,
    ctimeMs: 1696531596158.1772,
    birthtimeMs: 1695652120928.4453,
    atime: defaultDate,
    mtime: defaultDate,
    ctime: defaultDate,
    birthtime: defaultDate,
  };
}

// ### fs polyfills
// code based on node implementations

const UV_FS_SYMLINK_DIR = 1;
const UV_FS_SYMLINK_JUNCTION = 2;
const O_RDONLY = 0;
const O_WRONLY = 1;
const O_RDWR = 2;
const UV_DIRENT_UNKNOWN = 0;
const UV_DIRENT_FILE = 1;
const UV_DIRENT_DIR = 2;
const UV_DIRENT_LINK = 3;
const UV_DIRENT_FIFO = 4;
const UV_DIRENT_SOCKET = 5;
const UV_DIRENT_CHAR = 6;
const UV_DIRENT_BLOCK = 7;
const S_IFMT = 61440;
const S_IFREG = 32768;
const S_IFDIR = 16384;
const S_IFCHR = 8192;
const S_IFBLK = 24576;
const S_IFIFO = 4096;
const S_IFLNK = 40960;
const S_IFSOCK = 49152;
const O_CREAT = 512;
const O_EXCL = 2048;
const UV_FS_O_FILEMAP = 0;
const O_NOCTTY = 131072;
const O_TRUNC = 1024;
const O_APPEND = 8;
const O_DIRECTORY = 1048576;
const O_NOFOLLOW = 256;
const O_SYNC = 128;
const O_DSYNC = 4194304;
const O_SYMLINK = 2097152;
const O_NONBLOCK = 4;
const S_IRWXU = 448;
const S_IRUSR = 256;
const S_IWUSR = 128;
const S_IXUSR = 64;
const S_IRWXG = 56;
const S_IRGRP = 32;
const S_IWGRP = 16;
const S_IXGRP = 8;
const S_IRWXO = 7;
const S_IROTH = 4;
const S_IWOTH = 2;
const S_IXOTH = 1;
const F_OK = 0;
const R_OK = 4;
const W_OK = 2;
const X_OK = 1;
const UV_FS_COPYFILE_EXCL = 1;
const COPYFILE_EXCL = 1;
const UV_FS_COPYFILE_FICLONE = 2;
const COPYFILE_FICLONE = 2;
const UV_FS_COPYFILE_FICLONE_FORCE = 4;
const COPYFILE_FICLONE_FORCE = 4;

const kType = Symbol('type');
const kStats = Symbol('stats');

class Dirent {
  constructor(name, type, path) {
    this.name = name;
    this.path = path;
    this[kType] = type;
  }

  isDirectory() {
    return this[kType] === UV_DIRENT_DIR;
  }

  isFile() {
    return this[kType] === UV_DIRENT_FILE;
  }

  isBlockDevice() {
    return this[kType] === UV_DIRENT_BLOCK;
  }

  isCharacterDevice() {
    return this[kType] === UV_DIRENT_CHAR;
  }

  isSymbolicLink() {
    return this[kType] === UV_DIRENT_LINK;
  }

  isFIFO() {
    return this[kType] === UV_DIRENT_FIFO;
  }

  isSocket() {
    return this[kType] === UV_DIRENT_SOCKET;
  }
}

class DirentFromStats extends Dirent {
  constructor(name, stats, path) {
    super(name, null, path);
    this[kStats] = stats;
  }
}

const kEmptyObject = { __proto__: null };

function defaultCloseCallback(err) {
  if (err != null) throw err;
}

function maybeCallback(cb) {
  if (typeof cb !== 'function') {
    throw new Error('Param is not a function!');
  }

  return cb;
}

function assertEncoding(encoding) {
  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Invalid encoding!');
  }
}

function getOptions(options, defaultOptions = kEmptyObject) {
  if (options == null || typeof options === 'function') {
    return defaultOptions;
  }

  if (typeof options === 'string') {
    defaultOptions = { ...defaultOptions };
    defaultOptions.encoding = options;
    options = defaultOptions;
  } else if (typeof options !== 'object') {
    throw new Error('Invalid options!');
  }

  if (options.encoding !== 'buffer') assertEncoding(options.encoding);

  if (options.signal !== undefined) {
    // validateAbortSignal(options.signal, 'options.signal');
  }

  return options;
}

/**
 * Closes the file descriptor.
 * @param {number} fd
 * @param {(err?: Error) => any} [callback]
 * @returns {void}
 */
function close(fd, callback = defaultCloseCallback) {
  setTimeout(() => {
    // (In-memory implementation doesn't require explicit closing)
    callback(null);
  }, 0);
}

/**
 * Synchronously closes the file descriptor.
 * @param {number} fd
 * @returns {void}
 */
function closeSync(fd) {
  // (In-memory implementation doesn't require explicit closing)
}

/**
 * Asynchronously opens a file.
 * @param {string | Buffer | URL} path
 * @param {string | number} [flags]
 * @param {string | number} [mode]
 * @param {(
 *   err?: Error,
 *   fd?: number
 *   ) => any} callback
 * @returns {void}
 */
function open(path, flags, mode, callback) {
  // handle function args (code from node)
  if (arguments.length < 3) {
    callback = flags;
    flags = 'r';
    mode = 0o666;
  } else if (typeof mode === 'function') {
    callback = mode;
    mode = 0o666;
  } else {
    mode = '0o666';
  }

  setTimeout(() => {
    path = getValidatedPath(path);
    const file = getFile(path);
    if (file !== undefined) {
      const fileDescriptor = Symbol(`File Descriptor for ${path}`);

      callback(null, fileDescriptor);
    } else {
      const error = new Error(
        `ENOENT: no such file or directory, fs.open call for path '${path}'`,
      );
      error.code = 'ENOENT';

      callback(error);
    }
  }, 0);
}

/**
 * Synchronously opens a file.
 * @param {string | Buffer | URL} path
 * @param {string | number} [flags]
 * @param {string | number} [mode]
 * @returns {number}
 */
function openSync(path, flags, mode) {
  path = getValidatedPath(path);
  const file = getFile(path);
  if (file !== undefined) {
    const fileDescriptor = Symbol(`File Descriptor for ${path}`);

    return fileDescriptor;
  } else {
    const error = new Error(
      `ENOENT: no such file or directory, fs.openSync call for path '${path}'`,
    );
    error.code = 'ENOENT';

    throw error;
  }
}

/**
 * Asynchronously gets the stats of a file.
 * @param {string | Buffer | URL} path
 * @param {{ bigint?: boolean; }} [options]
 * @param {(
 *   err?: Error,
 *   stats?: any
 *   ) => any} callback
 * @returns {void}
 */
async function stat(path, options = { bigint: false }, callback) {
  // handle function args (code from node)
  if (typeof options === 'function') {
    callback = options;
    options = kEmptyObject;
  }

  path = getValidatedPath(path);

  setTimeout(() => {
    const filesInfos = getFilesInfos();
    if (!filesInfos.paths.includes(path)) {
      const error = new Error(
        `ENOENT: no such file or directory, fs.stat call for path '${path}'`,
      );
      error.code = 'ENOENT';
      callback(error);
    }

    const file = getFile(path);
    const isFile = filesInfos.files.includes(path);
    const size = isFile ? file.content.length : 0;

    // generate file informations
    const stats = generateDefaultStat();
    stats.size = size;
    stats.isFile = () => isFile;
    stats.isDirectory = () => !isFile;

    callback(null, stats);
  }, 0);
}

/**
 * Synchronously retrieves the `fs.Stats`
 * for the `path`.
 * @param {string | Buffer | URL} path
 * @param {{
 *   bigint?: boolean;
 *   throwIfNoEntry?: boolean;
 *   }} [options]
 * @returns {any}
 */
function statSync(path, options) {
  // checks final /
  path = getValidatedPath(path);

  // Synchronous method to get file information
  const filesInfos = getFilesInfos();
  if (!filesInfos.paths.includes(path)) {
    const error = new Error(
      `ENOENT: no such file or directory, fs.statSync call for path '${path}'`,
    );
    error.code = 'ENOENT';
    throw error;
  }

  const file = getFile(path);

  const isFile = filesInfos.files.includes(path);
  const size = isFile ? file.content.length : 0;

  // generate file informations
  const stats = generateDefaultStat();
  stats.size = size;
  stats.isFile = () => isFile;
  stats.isDirectory = () => !isFile;

  return stats;
}

/**
 * Asynchronously reads the entire contents of a file.
 * @param {string | Buffer | URL | number} path
 * @param {{
 *   encoding?: string | null;
 *   flag?: string;
 *   signal?: AbortSignal;
 *   } | string} [options]
 * @param {(
 *   err?: Error,
 *   data?: string | Buffer
 *   ) => any} callback
 * @returns {void}
 */
function readFile(path, options, callback) {
  // handle function args
  if (typeof options === 'function') {
    callback = options;
    options = { ...kEmptyObject };
  }
  callback = maybeCallback(callback || options);
  options = getOptions(options, { flag: 'r' });
  path = getValidatedPath(path);

  setTimeout(() => {
    const file = getFile(path);
    if (file !== undefined) {
      let content;
      if (options?.encoding === 'utf-8') {
        content = getFileContent(file, false);
      } else {
        content = getFileContent(file, true);
      }
      callback(null, content);
    } else {
      const error = new Error(
        `ENOENT: no such file or directory, fs.readFile call for path '${path}'`,
      );
      error.code = 'ENOENT';
      callback(error);
    }
  }, 0);
}

/**
 * Synchronously reads the entire contents of a file.
 * @param {string | Buffer | URL | number} path
 * @param {{
 *   encoding?: string | null;
 *   flag?: string;
 *   }} [options]
 * @returns {string | Buffer}
 */
function readFileSync(path, options) {
  path = getValidatedPath(path);
  options = getOptions(options, { flag: 'r' });

  const file = getFile(path);
  if (file !== undefined) {
    let content;
    if (options?.encoding === 'utf-8') {
      content = getFileContent(file, false);
    } else {
      content = getFileContent(file, true);
    }
    return content;
  } else {
    const error = new Error(
      `ENOENT: no such file or directory, fs.readFileSync call for path '${path}'`,
    );
    error.code = 'ENOENT';
    throw error;
  }
}

/**
 * Synchronously reads the contents of a directory.
 * @param {string | Buffer | URL} path
 * @param {string | {
 *   encoding?: string;
 *   withFileTypes?: boolean;
 *   recursive?: boolean;
 *   }} [options]
 * @returns {string | Buffer[] | Dirent[]}
 */
function readdirSync(path, options) {
  path = getValidatedPath(path);

  const filesInfos = getFilesInfos();
  const stats = statSync(path);

  if (!stats.isDirectory()) {
    const error = new Error(
      `ENOTDIR: not a directory, scandir - fs.readdirSync call for path '${path}'`,
    );
    error.code = 'ENOTDIR';
    throw error;
  }

  let result = [];
  const matchedElements = filesInfos.paths.filter(
    (dir) => dir.startsWith(path) && path !== dir,
  );
  const elementsInDir = [
    ...new Set(
      matchedElements.map(
        (element) => element.replace(`${path}/`, '').split('/')[0],
      ),
    ),
  ];

  // generate the list of elements in dir (strings or Dirents)
  if (options.withFileTypes) {
    result = elementsInDir.map((element) => {
      const name = element;
      const isFile = filesInfos.files.includes(`${path}/${element}`);
      const type = isFile ? UV_DIRENT_FILE : UV_DIRENT_DIR;
      return new Dirent(name, type, `${path}/${element}`);
    });
  } else {
    result = elementsInDir;
  }

  return result;
}

const promises = { readFile, stat };

const fs = {
  close,
  closeSync,
  open,
  openSync,
  stat,
  statSync,
  lstatSync: statSync,
  readFile,
  readFileSync,
  readdirSync,
  promises,
};

export default fs;

export {
  close,
  closeSync,
  open,
  openSync,
  stat,
  statSync,
  statSync as lstatSync,
  readFile,
  readFileSync,
  readdirSync,
  promises,
};

/* eslint-enable */
