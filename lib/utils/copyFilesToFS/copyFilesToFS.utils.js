import copyDirectory from '../copyDirectory/index.js';

/**
 * Copy files to directory ./edge/storage, so this files are uploaded to client's bucket.
 * @param {string[]} dirs - The directories to be copied to the FS.
 * @param {string} prefix - The prefix to be removed from the path.
 */
function copyFilesToFS(dirs, prefix) {
  const edgeStorageDir = '.edge/storage';

  dirs.forEach((dir) => {
    const path = prefix ? dir.replace(prefix, '') : dir;
    copyDirectory(dir, `${edgeStorageDir}/${path}`);
  });
}

export default copyFilesToFS;
