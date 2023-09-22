import fs from 'fs';
import path, { basename } from 'path';
import mime from 'mime-types';
import { copyDirectory, feedback } from '#utils';

/**
 * normalize directory path
 * @param {string} dir
 * @returns {string}
 */
function normalizeDirPath(dir) {
  const pathNormalize = path.normalize(dir);
  return pathNormalize.startsWith('/') ? pathNormalize : `/${pathNormalize}`;
}

/**
 * is trace file
 * @param {string} pathFile
 * @returns {boolean}
 */
function isTraceFile(pathFile) {
  if (/\b\w+\.nft\.json\b/.test(pathFile) || /\/\.next\/trace/.test(pathFile)) {
    return true;
  }
  return false;
}

/**
 * Read the directories and include files
 * @param {string} rootDir - main folder where to get the directories. e.g ./
 * @param {string} currentDir - current directory
 * @param {object[]} result - result to path files
 * @param {string[]} includeDirs - directories for the build. e.g ["./.next"]
 * @param {string[]} excludeDirs - exclude directories. e.g [".next/cache", "node_modules"]
 * @param {string[]} files - include files. default ["next.config"]
 * @param {string[]} extNames - extension to include files. default [".js", ".mjs"]
 */
function readDirAndIncludeFiles(
  rootDir,
  currentDir,
  result,
  includeDirs,
  excludeDirs = ['node_modules'],
  files = ['next.config'],
  extNames = ['.js', '.mjs', '.cjs'],
) {
  const entries = fs.readdirSync(path.resolve(rootDir, currentDir), {
    withFileTypes: true,
  });
  for (const entry of entries) {
    const name = path.resolve(rootDir, currentDir, entry.name);
    const isDirectory = entry.isDirectory();
    const ext = path.extname(entry.name).toLowerCase();
    const nameAsset = normalizeDirPath(path.relative(rootDir, name));
    if (
      isDirectory &&
      !excludeDirs.some((dir) => nameAsset.startsWith(normalizeDirPath(dir)))
    ) {
      readDirAndIncludeFiles(
        rootDir,
        name,
        result,
        includeDirs,
        excludeDirs,
        files,
        extNames,
      );
    }
    if (
      extNames.includes(ext) &&
      files.includes(`${entry.name.replace(ext, '')}`)
    ) {
      const fileName = normalizeDirPath(basename(name));
      if (!result.find((file) => file.name === fileName)) {
        result.push({
          name: fileName,
          path: `${path.dirname(name)}${fileName}`,
        });
      }
    }
    if (
      entry.isFile() &&
      includeDirs.some((dir) => nameAsset.startsWith(normalizeDirPath(dir)))
    ) {
      if (isTraceFile(nameAsset)) {
        continue;
      }
      result.push({
        name: normalizeDirPath(path.relative(rootDir, name)),
        path: name,
      });
    }
  }
}

/**
 * Test module
 * @param {string} path - path file
 * @returns
 */
function moduleTest(path) {
  if (path.endsWith('/next.config.js') || path.endsWith('/next.config.mjs')) {
    return true;
  }
  return (
    path.indexOf('/.next/server/') !== -1 &&
    !path.endsWith('.html') &&
    !path.endsWith('.map') &&
    !path.endsWith('.json')
  );
}

/**
 * Class build static Custom Server Next.js
 * @example
 *
 *   const buildStatic = new BuildStatic({
 *      rootDir: "../",
 *      includeDirs: ["./.next", "./public"],
 *      staticDirs: ["public", ".next/static"],
 *      excludeDirs: ["./.next/cache"],
 *      out: "tmp-next-build",
 *      versionId: "20230828181018",
 *      staticOutDir: ".edge/storage"
 *   });
 *
 *   buildStatic.run();
 */
class BuildStatic {
  /**
   * Create a Dispatcher.
   * @param {object} config - The config build static.
   * @param {string} config.rootDir - main folder where to get the directories. e.g ./
   * @param {string[]} config.includeDirs - directories for the build. e.g [".next"]
   * @param {string[]} config.staticDirs - static directories. e.g [".next", "/public"]
   * @param {string[]} config.excludeDirs - exclude directories. e.g [".next/cache"]
   * @param {string} config.out - directory where the file will be generated
   * @param {string} config.versionId - versionId static storage e.g 20230828181018
   * @param {string} config.staticOutDir - folder where statics are sent for upload default (.edge/storage)
   */
  constructor(config) {
    this.config = config;
    this.config.staticOutDir = this.config.staticOutDir || '.edge/storage';
  }

  run = () => {
    if (this.config?.includeDirs?.length === 0) {
      throw new Error('please include at least one directory');
    }
    fs.rmSync(path.resolve(this.config.rootDir, this.config.staticOutDir), {
      recursive: true,
      force: true,
    });
    fs.mkdirSync(path.resolve(this.config.rootDir, this.config.out), {
      recursive: true,
    });

    const FILES_ADDED = [];
    readDirAndIncludeFiles(
      this.config.rootDir,
      '',
      FILES_ADDED,
      this.config.includeDirs,
      this.config.excludeDirs,
    );
    const staticFiles = FILES_ADDED.filter((file) =>
      this.config.staticDirs.some((stDirs) =>
        file.name.startsWith(normalizeDirPath(stDirs)),
      ),
    );
    const serverFiles = FILES_ADDED.filter(
      (file) =>
        !this.config.staticDirs.some((stDirs) =>
          file.name.startsWith(normalizeDirPath(stDirs)),
        ),
    );

    let assets = '';
    let fileContent = `
    /* 
     * Generated by Vulcan.
     */
   \n`;

    const totalFilterFiles = serverFiles.length + staticFiles.length;
    feedback.prebuild.interactive.await(
      `[%d/${totalFilterFiles}] - build config and static files`,
      1,
    );
    let countProcessFile = 0;

    // import server module files
    for (const [index, file] of serverFiles.entries()) {
      const moduleTestValue = moduleTest(normalizeDirPath(file.name));
      const contentType = mime.lookup(file.name);
      if (moduleTestValue) {
        const relativeFilePath = path.relative(
          this.config.out,
          `/${file.path}`,
        );
        fileContent += `import * as fileModule${index} from "${relativeFilePath}";\n`;
        assets += `${JSON.stringify(
          file.name,
        )}: { contentType: "${contentType}", content: "", isStatic: false, module: fileModule${index} },\n`;
      } else {
        const pathFile = path.resolve(this.config.rootDir, file.path);
        const arrayBuffer = fs.readFileSync(pathFile);
        const bufferObject = JSON.stringify(arrayBuffer.toString('base64'));
        assets += `${JSON.stringify(
          file.name,
        )}: { contentType: "${contentType}", content: ${bufferObject}, isStatic: false, module: null },\n`;
      }
      countProcessFile += 1;
      feedback.prebuild.interactive.await(
        `[%d/${totalFilterFiles}] - ${file.name}`,
        countProcessFile,
      );
    }

    // create statics content
    fileContent += `\nexport const assets = {\n`;
    for (const [index, file] of staticFiles.entries()) {
      const contentType = mime.lookup(file.name);
      assets += `${JSON.stringify(
        file.name,
      )}: { contentType: "${contentType}", content: ${JSON.stringify(
        `${this.config.versionId}${file.name}`,
      )}, isStatic: true, module: null },\n`;
      countProcessFile += 1;
      feedback.prebuild.interactive.await(
        `[%d/${totalFilterFiles}] - ${file.name}`,
        countProcessFile,
      );
    }

    fileContent += assets;

    fileContent += '};\n';

    fs.writeFileSync(
      path.resolve(this.config.rootDir, this.config.out, 'statics.js'),
      fileContent,
    );

    for (let i = 0; i < this.config.staticDirs.length; i++) {
      const dir = this.config.staticDirs[i];
      copyDirectory(
        path.resolve(this.config.rootDir, dir),
        path.resolve(this.config.rootDir, this.config.staticOutDir, dir),
      );
    }

    feedback.prebuild.success(
      `[${countProcessFile}] - The total number of files processed!`,
    );
  };
}

export default BuildStatic;
