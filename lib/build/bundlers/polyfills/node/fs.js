/* eslint-disable max-classes-per-file */
import bPath from 'path';
import { Buffer } from 'buffer';

/* eslint-disable */

const MEM_FILES = globalThis.vulcan.__FILES__;

globalThis.vulcan.FS_PATHS_CHANGED = false;

/**
 * fix mapped files paths based on path prefix
 */
function fixMappedFilesPaths() {
  const prefix = globalThis.vulcan.FS_PATH_PREFIX_TO_REMOVE;
  if (!globalThis.vulcan.FS_PATHS_CHANGED && prefix !== "") {
    Object.keys(MEM_FILES).forEach((e) => {
      const newKey = e.replace(prefix, '');
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
  if (MEM_FILES && typeof MEM_FILES === 'object') {
    return Object.keys(MEM_FILES);
  }

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
      const dirPath = bPath.dirname(filePath);

      let currentPath = '/';
      let pathSegments = dirPath.split('/');
      for (let i = 0; i < pathSegments.length; i++) {
        currentPath = bPath.join(currentPath, pathSegments[i]);
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
  if (path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  if (!path.startsWith('/')) {
    path = bPath.join('/', path);
  }

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

const UV_DIRENT_FILE = 1;
const UV_DIRENT_DIR = 2;
const UV_DIRENT_LINK = 3;
const UV_DIRENT_FIFO = 4;
const UV_DIRENT_SOCKET = 5;
const UV_DIRENT_CHAR = 6;
const UV_DIRENT_BLOCK = 7;

const kType = Symbol('type');

class CustomDirent {
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

const kEmptyObject = { __proto__: null };

function defaultCloseCallback(err) {
  if (err != null) throw err;
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
 * @param {function(Error): any} [callback]
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
 * Synchronously retrieves the `fs.Stats`
 * for the `path`.
 * @param {string | Buffer | URL} path
 * @param {Object} [options]
 * @param {boolean} [options.bigint]
 * @param {boolean} [options.throwIfNoEntry]
 * @returns {any}
 */
function statSync(path, options = {}) {
  // checks final
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
 * Synchronously reads the entire contents of a file.
 * @param {string | Buffer | URL | number} path
 * @param {Object | string} [options] - Options object or encoding string.
 * @param {string} [options.encoding] - The file encoding.
 * @param {string} [options.flag] - The flag.
 * @returns {string | Buffer}
 */
function readFileSync(path, options = {}) {
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
 * @param {string | Object} [options] - Options object or encoding string.
 * @param {string} [options.encoding] - The encoding.
 * @param {boolean} [options.withFileTypes] - Whether to include file types.
 * @param {boolean} [options.recursive] - Whether to include subdirectories.
 */
function readdirSync(path, options = {}) {
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
  let elementsInDir;
  if (path === '/') {
    elementsInDir = matchedElements.filter(
      (element) => !element.substring(1).includes('/'),
    );
  } else {
    elementsInDir = [
      ...new Set(
        matchedElements.map(
          (element) => element.replace(`${path}/`, '').split('/')[0],
        ),
      ),
    ];
  }
  // generate the list of elements in dir (strings or Dirents)
  if (options.withFileTypes) {
    result = elementsInDir.map((element) => {
      const name = element;
      const isFile = filesInfos.files.includes(`${path}/${element}`);
      const type = isFile ? UV_DIRENT_FILE : UV_DIRENT_DIR;
      return new CustomDirent(name, type, `${path}/${element}`);
    });
  } else {
    result = elementsInDir;
  }

  return result;
}

// Use Cells node:fs API
const fsPolyfill = Object.create(SRC_NODE_FS);
fsPolyfill.close = close;
fsPolyfill.closeSync = closeSync;
fsPolyfill.openSync = openSync;
fsPolyfill.statSync = statSync;
fsPolyfill.lstatSync = statSync;
fsPolyfill.readFileSync = readFileSync;
fsPolyfill.readdirSync = readdirSync;

export default fsPolyfill;

export {
  close,
  closeSync,
  openSync,
  statSync,
  statSync as lstatSync,
  readFileSync,
  readdirSync,
};

export const {
  access,
  accessSync,
  appendFile,
  appendFileSync,
  chmod,
  chmodSync,
  chown,
  chownSync,
  constants,
  copyFile,
  copyFileSync,
  cp,
  cpSync,
  createReadStream,
  createWriteStream,
  Dir,
  Dirent,
  exists,
  existsSync,
  F_OK,
  fdatasync,
  fdatasyncSync,
  fstat,
  fstatSync,
  fsync,
  fsyncSync,
  ftruncate,
  ftruncateSync,
  futimes,
  futimesSync,
  link,
  linkSync,
  lstat,
  mkdir,
  mkdirSync,
  mkdtemp,
  mkdtempSync,
  O_APPEND,
  O_CREAT,
  O_DIRECTORY,
  O_DSYNC,
  O_EXCL,
  O_NOCTTY,
  O_NOFOLLOW,
  O_NONBLOCK,
  O_RDONLY,
  O_RDWR,
  O_SYMLINK,
  O_SYNC,
  O_TRUNC,
  O_WRONLY,
  open,
  opendir,
  opendirSync,
  read,
  readSync,
  promises,
  R_OK,
  readdir,
  readFile,
  readlink,
  readlinkSync,
  ReadStream,
  realpath,
  realpathSync,
  readv,
  readvSync,
  rename,
  renameSync,
  rmdir,
  rmdirSync,
  rm,
  rmSync,
  stat,
  Stats,
  statfs,
  statfsSync,
  symlink,
  symlinkSync,
  truncate,
  truncateSync,
  unlink,
  unlinkSync,
  unwatchFile,
  utimes,
  utimesSync,
  W_OK,
  watch,
  watchFile,
  write,
  writeFile,
  writev,
  writevSync,
  writeFileSync,
  WriteStream,
  writeSync,
  X_OK,
} = SRC_NODE_FS;

/* eslint-enable */
