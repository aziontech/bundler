/**
 * Get the absolute path of the lib dir based on current module
 * @returns {string} the lib full path
 */
function getAbsoluteLibDirPath() {
  const currentModuleFullPath = import.meta.url;
  let baselibPath = currentModuleFullPath.match(/(.*lib)(.*)/)[1];
  baselibPath = baselibPath.replace('file://', '');

  return baselibPath;
}

export default getAbsoluteLibDirPath;
