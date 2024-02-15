import fs from 'fs';
import path, { basename } from 'path';
import mime from 'mime-types';
import { feedback } from '#utils';

/**
 * normalize directory path
 * @param {string} dir the dir path to normalize
 * @returns {string} the normalized path
 */
function normalizeDirPath(dir) {
  const pathNormalize = path.normalize(dir);
  return pathNormalize.startsWith('/') ? pathNormalize : `/${pathNormalize}`;
}

/**
 * is trace file
 * @param {string} pathFile the file path
 * @returns {boolean} the indication that it is a trace file
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
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
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
        // eslint-disable-next-line no-continue
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
 * Tests the file to indicate whether it will be treated as a module
 * @param {string} pathFile - path file
 * @returns {boolean} indicative that the file must be treated as a module
 */
function moduleTest(pathFile) {
  if (
    pathFile.endsWith('/next.config.js') ||
    pathFile.endsWith('/next.config.mjs')
  ) {
    return true;
  }
  return (
    pathFile.indexOf('/.next/server/') !== -1 &&
    !pathFile.endsWith('.html') &&
    !pathFile.endsWith('.map') &&
    !pathFile.endsWith('.json')
  );
}

/**
 * Class build static Custom Server Next.js
 * @example
 *
 *   const buildStatic = new BuildStatic({
 *      rootDir: "../",
 *      includeDirs: ["./.next", "./public"],
 *      staticDirs: [
 *         { name: './public', replace: '/' },
 *         { name: './.next/static', replace: './_next/static' },
 *      ],
 *      excludeDirs: ["./.next/cache"],
 *      out: "tmp-next-build",
 *      staticOutDir: ".edge/storage"
 *   });
 *
 *   buildStatic.run();
 */
class BuildStatic {
  /**
   * Cria um BuildStatic.
   * @param {object} config - A configuração para a construção estática.
   * @param {string} config.rootDir - Pasta principal de onde obter os diretórios. Ex: ./
   * @param {string[]} config.includeDirs - Diretórios para a construção. Ex: [".next"]
   * @param {string[]} config.excludeDirs - Diretórios excluídos. Ex: [".next/cache"]
   * @param {string} config.out - Diretório onde o arquivo será gerado
   * @param {string} config.staticOutDir - Pasta para onde os estáticos são enviados para upload. Padrão: (.edge/storage)
   * @param {Array<{ name: string, replace: string | undefined }>} config.staticDirs - Diretórios estáticos.
   * @param {string} config.staticDirs.name - Nome do diretório estático. Ex: './.next/static' | './public'.
   * @param {string | undefined} config.staticDirs.replace - Este campo é usado para substituir o caminho original. Ex: './.next/static' para './_next/static'.
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
        file.name.startsWith(normalizeDirPath(stDirs.name)),
      ),
    );
    const serverFiles = FILES_ADDED.filter(
      (file) =>
        !this.config.staticDirs.some((stDirs) =>
          file.name.startsWith(normalizeDirPath(stDirs.name)),
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
    for (let index = 0; index < serverFiles.length; index++) {
      const file = serverFiles[index];
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
        )}: { contentType: "${contentType}", content: "", isStatic: false, module: fileModule${index}, mode: "module" },\n`;
      } else {
        // inline static
        const pathFile = path.resolve(this.config.rootDir, file.path);
        const arrayBuffer = fs.readFileSync(pathFile);
        const bufferObject = JSON.stringify(arrayBuffer.toString('base64'));
        // remove unnecessary inline files
        if (!file.name.endsWith('.html') && !file.name.endsWith('.map')) {
          assets += `${JSON.stringify(
            file.name,
          )}: { contentType: "${contentType}", content: ${bufferObject}, isStatic: false, module: null, mode: "inline" },\n`;
        }
      }
      countProcessFile += 1;
      feedback.prebuild.interactive.await(
        `[%d/${totalFilterFiles}] - ${file.name}`,
        countProcessFile,
      );
    }

    // create statics content
    fileContent += `\nexport const assets = {\n`;
    const assetEntries = staticFiles.map((file) => {
      const contentType = mime.lookup(file.name);

      // It is necessary to replace the static directories for the .vercel output,
      // which has the _next pattern and the public folder does not exist
      // as the files are in the root (.vercel/output/static).
      const dirToReplace = this.config.staticDirs.find(({ name }) =>
        file.name.includes(normalizeDirPath(name)),
      );
      let fileNameReplacement = file.name;
      if (dirToReplace && dirToReplace.replace !== undefined) {
        const dirName = normalizeDirPath(dirToReplace.name);
        const dirNameReplace = normalizeDirPath(dirToReplace.replace);
        fileNameReplacement = file.name.replace(
          dirName,
          dirNameReplace === '/' ? '' : dirNameReplace,
        );
      }

      const assetEntry = `${JSON.stringify(
        file.name,
      )}: { contentType: "${contentType}", content: ${JSON.stringify(
        `${fileNameReplacement}`,
      )}, isStatic: true, module: null, mode: "storage" }`;

      countProcessFile += 1;
      feedback.prebuild.interactive.await(
        `[%d/${totalFilterFiles}] - ${file.name}`,
        countProcessFile,
      );

      return assetEntry;
    });

    fileContent += assets;

    fileContent += assetEntries.join(',\n');

    fileContent += '};\n';

    fs.writeFileSync(
      path.resolve(this.config.rootDir, this.config.out, 'statics.js'),
      fileContent,
    );

    feedback.prebuild.success(
      `[${countProcessFile}] - The total number of files processed!`,
    );
  };
}

export default BuildStatic;
