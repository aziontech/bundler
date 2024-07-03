/* eslint-disable */
const localFs = {};

async function open(...args) {
  return FS_CONTEXT.open(...args);
}

function openSync(...args) {
  return FS_CONTEXT.openSync(...args);
}

async function close(...args) {
  return FS_CONTEXT.close(...args);
}

function closeSync(...args) {
  return FS_CONTEXT.closeSync(...args);
}

async function stat(...args) {
  return FS_CONTEXT.stat(...args);
}

function statSync(...args) {
  return FS_CONTEXT.statSync(...args);
}

async function lstat(...args) {
  return FS_CONTEXT.lstat(...args);
}

function lstatSync(...args) {
  return FS_CONTEXT.lstatSync(...args);
}

async function readFile(...args) {
  return FS_CONTEXT.readFile(...args);
}

function readFileSync(...args) {
  return FS_CONTEXT.readFileSync(...args);
}

async function readdir(...args) {
  return FS_CONTEXT.readdir(...args);
}

function readdirSync(...args) {
  return FS_CONTEXT.readdirSync(...args);
}

async function mkdir(...args) {
  return FS_CONTEXT.mkdir(...args);
}

async function rmdir(...args) {
  return FS_CONTEXT.rmdir(...args);
}

async function copyFile(...args) {
  return FS_CONTEXT.copyFile(...args);
}

async function cp(...args) {
  return FS_CONTEXT.cp(...args);
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
