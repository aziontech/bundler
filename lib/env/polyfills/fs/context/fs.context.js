/* eslint-disable */

import fs from 'fs';

const localFs = {};

export const {
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
  Dir,
  Dirent,
  Stats,
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
} = fs;

export { promises } from 'fs';
localFs.promises = fs.promises;

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
localFs.Dir = Dir;
localFs.Dirent = Dirent;
localFs.Stats = Stats;
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
