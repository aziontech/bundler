/* eslint-disable */
import { join } from 'node:path';

const localFsPromises = {};

const BUILD_PATH_PREFIX = '.edge/storage';

async function open(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.promises.open(path, ...args);
}

async function stat(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.promises.stat(path, ...args);
}

async function lstat(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.promises.lstat(path, ...args);
}

async function readFile(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.promises.readFile(path, ...args);
}

async function readdir(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.promises.readdir(path, ...args);
}

async function mkdir(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.promises.mkdir(path, ...args);
}

async function rmdir(path, ...args) {
  path = join(BUILD_PATH_PREFIX, path);
  return FS_CONTEXT.promises.rmdir(path, ...args);
}

async function copyFile(src, dest, ...args) {
  src = `${BUILD_PATH_PREFIX}/${src}`;
  dest = `${BUILD_PATH_PREFIX}/${dest}`;
  return FS_CONTEXT.promises.copyFile(src, dest, ...args);
}

async function cp(src, dest, ...args) {
  src = `${BUILD_PATH_PREFIX}/${src}`;
  dest = `${BUILD_PATH_PREFIX}/${dest}`;
  return FS_CONTEXT.promises.cp(src, dest, ...args);
}

async function writeFile(path, data, ...args) {
  path = `${BUILD_PATH_PREFIX}/${path}`;
  return FS_CONTEXT.promises.writeFile(path, data, ...args);
}

async function rename(src, dest) {
  src = `${BUILD_PATH_PREFIX}/${src}`;
  dest = `${BUILD_PATH_PREFIX}/${dest}`;
  return FS_CONTEXT.promises.rename(src, dest);
}

async function realpath(src, ...args) {
  src = `${BUILD_PATH_PREFIX}/${src}`;
  return FS_CONTEXT.promises.realpath(src, ...args);
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

export {
  open,
  stat,
  lstat,
  readFile,
  readdir,
  mkdir,
  rmdir,
  copyFile,
  cp,
  constants,
  writeFile,
  rename,
  realpath,
};

localFsPromises.open = open;
localFsPromises.stat = stat;
localFsPromises.lstat = lstat;
localFsPromises.readFile = readFile;
localFsPromises.readdir = readdir;
localFsPromises.mkdir = mkdir;
localFsPromises.rmdir = rmdir;
localFsPromises.copyFile = copyFile;
localFsPromises.cp = cp;
localFsPromises.constants = constants;
localFsPromises.writeFile = writeFile;
localFsPromises.rename = rename;
localFsPromises.realpath = realpath;

export default localFsPromises;
