/* eslint-disable */
import { join } from 'node:path';
import promises from './promises/promises.polyfills.js';

const localFs = {};

const BUILD_PATH_PREFIX = '.edge/storage';

function open(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.open(path, ...args);
}

function openSync(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.openSync(path, ...args);
}

function close(...args) {
  return FS_CONTEXT.close(...args);
}

function closeSync(...args) {
  return FS_CONTEXT.closeSync(...args);
}

function stat(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.stat(path, ...args);
}

function statSync(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.statSync(path, ...args);
}

function lstat(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.lstat(path, ...args);
}

function lstatSync(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.lstatSync(path, ...args);
}

function readFile(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.readFile(path, ...args);
}

function readFileSync(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.readFileSync(path, ...args);
}

function readdir(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.readdir(path, ...args);
}

function readdirSync(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.readdirSync(path, ...args);
}

function mkdir(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.mkdir(path, ...args);
}

function rmdir(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.rmdir(path, ...args);
}

function copyFile(src, dest, ...args) {
  src = `${BUILD_PATH_PREFIX}/${src}`;
  dest = `${BUILD_PATH_PREFIX}/${dest}`;
  return FS_CONTEXT.copyFile(src, dest, ...args);
}

function cp(src, dest, ...args) {
  src = `${BUILD_PATH_PREFIX}/${src}`;
  dest = `${BUILD_PATH_PREFIX}/${dest}`;
  return FS_CONTEXT.cp(src, dest, ...args);
}

async function writeFile(path, data, ...args) {
  path = `${BUILD_PATH_PREFIX}/${path}`;
  return FS_CONTEXT.writeFile(path, data, ...args);
}

async function rename(src, dest, ...args) {
  src = `${BUILD_PATH_PREFIX}/${src}`;
  dest = `${BUILD_PATH_PREFIX}/${dest}`;
  return FS_CONTEXT.rename(src, dest, ...args);
}

async function realpath(src, ...args) {
  src = `${BUILD_PATH_PREFIX}/${src}`;
  return FS_CONTEXT.realpath(src, ...args);
}

const constants = {
  COPYFILE_EXCL: 1,
  COPYFILE_FICLONE: 2,
  COPYFILE_FICLONE_FORCE: 4,
  F_OK: 0,
  O_APPEND: 8,
  O_CREAT: 512,
  O_DIRECTORY: 1048576,
  O_DSYNC: 4194304,
  O_EXCL: 2048,
  O_NOCTTY: 131072,
  O_NOFOLLOW: 256,
  O_NONBLOCK: 4,
  O_RDONLY: 0,
  O_RDWR: 2,
  O_SYMLINK: 2097152,
  O_SYNC: 128,
  O_TRUNC: 1024,
  O_WRONLY: 1,
  R_OK: 4,
  S_IRGRP: 32,
  S_IROTH: 4,
  S_IRUSR: 256,
  S_IWGRP: 16,
  S_IWOTH: 2,
  S_IWUSR: 128,
  S_IXGRP: 8,
  S_IXOTH: 1,
  S_IXUSR: 64,
  UV_FS_COPYFILE_EXCL: 1,
  UV_FS_COPYFILE_FICLONE: 2,
  UV_FS_COPYFILE_FICLONE_FORCE: 4,
  W_OK: 2,
  X_OK: 1,
};
const F_OK = 0;
const O_APPEND = 8;
const O_CREAT = 512;
const O_DIRECTORY = 1048576;
const O_DSYNC = 4194304;
const O_EXCL = 2048;
const O_NOCTTY = 131072;
const O_NOFOLLOW = 256;
const O_NONBLOCK = 4;
const O_RDONLY = 0;
const O_RDWR = 2;
const O_SYMLINK = 2097152;
const O_SYNC = 128;
const O_TRUNC = 1024;
const O_WRONLY = 1;
const R_OK = 4;
const W_OK = 2;
const X_OK = 1;

export {
  promises,
  open,
  openSync,
  close,
  closeSync,
  stat,
  statSync,
  lstat,
  lstatSync,
  readFile,
  readFileSync,
  readdir,
  readdirSync,
  mkdir,
  rmdir,
  copyFile,
  cp,
  writeFile,
  rename,
  realpath,
  constants,
  F_OK,
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
  R_OK,
  W_OK,
  X_OK,
};

localFs.promises = promises;

localFs.open = open;
localFs.openSync = openSync;
localFs.close = close;
localFs.closeSync = closeSync;
localFs.stat = stat;
localFs.statSync = statSync;
localFs.lstat = lstat;
localFs.lstatSync = lstatSync;
localFs.readFile = readFile;
localFs.readFileSync = readFileSync;
localFs.readdir = readdir;
localFs.readdirSync = readdirSync;
localFs.mkdir = mkdir;
localFs.rmdir = rmdir;
localFs.copyFile = copyFile;
localFs.cp = cp;
localFs.writeFile = writeFile;
localFs.rename = rename;
localFs.realpath = realpath;
localFs.constants = constants;
localFs.F_OK = F_OK;
localFs.O_APPEND = O_APPEND;
localFs.O_CREAT = O_CREAT;
localFs.O_DIRECTORY = O_DIRECTORY;
localFs.O_DSYNC = O_DSYNC;
localFs.O_EXCL = O_EXCL;
localFs.O_NOCTTY = O_NOCTTY;
localFs.O_NOFOLLOW = O_NOFOLLOW;
localFs.O_NONBLOCK = O_NONBLOCK;
localFs.O_RDONLY = O_RDONLY;
localFs.O_RDWR = O_RDWR;
localFs.O_SYMLINK = O_SYMLINK;
localFs.O_SYNC = O_SYNC;
localFs.O_TRUNC = O_TRUNC;
localFs.O_WRONLY = O_WRONLY;
localFs.R_OK = R_OK;
localFs.W_OK = W_OK;
localFs.X_OK = X_OK;

export default localFs;
