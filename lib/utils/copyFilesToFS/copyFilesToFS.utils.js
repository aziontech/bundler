import copyDirectory from '../copyDirectory/index.js';

/**
 * Copy files to directory ./edge/storage, so this files are uploaded to client's bucket.
 * @param {string[]} dirs - The directories to be copied to the FS.
 */
function copyFilesToFS(dirs) {
  const edgeStorageDir = '.edge/storage';

  dirs.forEach((dir) => {
    copyDirectory(dir, `${edgeStorageDir}/${dir}`);
  });
}

export default copyFilesToFS;
