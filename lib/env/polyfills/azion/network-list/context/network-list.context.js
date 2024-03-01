import ipLib from 'ip';
import nodePath from 'node:path';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

/**
 * This class is a VM context (NETWORK_LIST_CONTEXT) to handle with network list
 * @class NetworkListContext
 * @description Class to manage the network list
 */
class NetworkListContext {
  /**
   * Cache Dynamic Import flag - If true, the file will be reloaded every time default: true
   */
  #cacheDynamicImport;

  #networkList = [];

  #workDir = '.edge';

  #configFile = 'azion.config.js';

  /**
   * Creates an instance of NetworkListContext.
   * @param {boolean} [cacheDynamicImport=true] - Cache Dynamic Import flag - If false, the file will be reloaded every time default: true
   */
  constructor(cacheDynamicImport = true) {
    this.#cacheDynamicImport = cacheDynamicImport;
    this.#init();
  }

  /**
   * Check if the network list contains the value
   * @param {string} networkListId - The network list id
   * @param {string} value - The value to check
   * @returns {boolean} - Return true if the network list contains the value
   * @memberof NetworkListContext
   */
  contains(networkListId, value) {
    const network = this.#networkList.find(
      (networkItem) =>
        parseInt(networkItem.id, 10) === parseInt(networkListId, 10),
    );
    return this.#containsType(network, value);
  }

  #containsType(network, value) {
    switch (network?.listType) {
      case 'ip_cidr':
        return this.#networkCIDR(value, network);
      case 'asn':
        return this.#networkAsn(value, network);
      case 'countries':
        return this.#networkCountries(value, network);
      default:
        return false;
    }
  }

  // eslint-disable-next-line class-methods-use-this
  #networkCIDR(ipAddress, network) {
    const listContent = network?.listContent;
    if (!listContent || listContent.length === 0) return false;
    return listContent.some((currentIp) => {
      if (currentIp.includes('/')) {
        return ipLib.cidrSubnet(currentIp).contains(ipAddress);
      }
      return currentIp === ipAddress;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  #networkAsn(asn, network) {
    const listContent = network?.listContent;
    if (!listContent || listContent.length === 0) return false;
    return listContent.some((currentAsn) => {
      return parseInt(currentAsn, 10) === parseInt(asn, 10);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  #networkCountries(country, network) {
    const listContent = network?.listContent;
    if (!listContent || listContent.length === 0) return false;
    return listContent.some((currentCountry) => {
      return currentCountry === country;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  async #init() {
    try {
      const config = await this.#loadConfigFile();
      this.#networkList = config.networkList;
    } catch (error) {
      this.#networkList = [];
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async #loadConfigFile() {
    const { configFilePath, rootPath } = this.#getConfigFilePath();

    const {
      type: typeImport,
      changed,
      currentConfigPath,
      matchPaths,
    } = this.#checkFileImportType(configFilePath);

    let config;
    if (typeImport === 'esm') {
      config = await this.#importEsmModule(
        rootPath,
        currentConfigPath,
        changed,
      );
    } else {
      config = await this.#importCjsModule(
        rootPath,
        currentConfigPath,
        changed,
        matchPaths,
      );
    }

    return config?.default || config;
  }

  // eslint-disable-next-line class-methods-use-this
  #getConfigFilePath() {
    const projectRoot = process.cwd();
    const isWindows = process.platform === 'win32';
    const rootPath = isWindows
      ? fileURLToPath(new URL(`file:///${nodePath.resolve(projectRoot, '.')}`))
      : nodePath.resolve(projectRoot, '.');
    return {
      configFilePath: nodePath.resolve(rootPath, this.#configFile),
      rootPath,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  async #importEsmModule(rootPath, originalConfigPath, changed) {
    let pathCache = originalConfigPath;
    if (!this.#cacheDynamicImport) {
      pathCache = `${originalConfigPath}?u=${Date.now()}`;
    }
    const config = (await import(pathCache)).default;
    if (changed) {
      rmSync(originalConfigPath);
    }
    return config;
  }

  // eslint-disable-next-line class-methods-use-this
  async #importCjsModule(rootPath, configFilePath, changed, matchPaths) {
    if (!this.#cacheDynamicImport) {
      delete require.cache[configFilePath];
      if (changed && matchPaths?.length > 0) {
        matchPaths.forEach((match) => {
          delete require.cache[nodePath.resolve(rootPath, match)];
        });
      }
    }
    return new Promise((resolve) => {
      // eslint-disable-next-line import/no-dynamic-require
      resolve(require(configFilePath));
    });
  }

  // eslint-disable-next-line class-methods-use-this
  #checkFileImportType(originalConfigPath) {
    const file = readFileSync(originalConfigPath, 'utf8');
    if (file?.includes('export default')) {
      const { changed, currentConfigPath } = this.#changeEsmImports(
        originalConfigPath,
        file,
      );
      return { type: 'esm', changed, currentConfigPath };
    }
    const { changed, matchPaths } = this.#changeCjsImports(file);
    return {
      type: 'cjs',
      changed,
      currentConfigPath: originalConfigPath,
      matchPaths,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  #changeEsmImports(originalConfigPath, file) {
    const regex = /import\s+(.*)\s+from\s+['"]\.(.*)['"]/g;
    let changed = false;
    let fileUpdated = file;
    if (file.match(regex)) {
      changed = true;
      fileUpdated = file.replace(
        regex,
        `import $1 from "..$2?u=${Date.now()}"`,
      );
      const tmpFile = this.#configFile.replace('.js', '.temp.js');
      const tmpConfigPath = nodePath.join(
        process.cwd(),
        this.#workDir,
        tmpFile,
      );
      writeFileSync(tmpConfigPath, fileUpdated, 'utf8');
      return { changed, currentConfigPath: tmpConfigPath };
    }
    return { changed, currentConfigPath: originalConfigPath };
  }

  // eslint-disable-next-line class-methods-use-this
  #changeCjsImports(file) {
    let changed = false;
    const regex = /require\(['"]([^'"]+)['"]\)/g;
    const matchPaths = [];
    let match = regex.exec(file);
    while (match !== null) {
      changed = true;
      matchPaths.push(match[1]);
      match = regex.exec(file);
    }
    return { changed, matchPaths };
  }
}

export default NetworkListContext;
