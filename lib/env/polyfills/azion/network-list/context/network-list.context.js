import ipLib from 'ip';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
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
   * Cache Import file flag - If true, the file will be reloaded every time default: true
   */
  #cacheImportFile;

  #networkList = [];

  #configFile = 'azion.config.js';

  /**
   * Creates an instance of NetworkListContext.
   * @param {boolean} [cacheImportFile=true] - Cache Import file flag - If true, the file will be reloaded every time default: true
   */
  constructor(cacheImportFile = true) {
    this.#cacheImportFile = cacheImportFile;
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
    const projectRoot = process.cwd();
    const isWindows = process.platform === 'win32';
    const outputPath = isWindows
      ? fileURLToPath(new URL(`file:///${join(projectRoot, '.')}`))
      : join(projectRoot, '.');
    const configFilePath = join(outputPath, this.#configFile);

    const typeImport = this.#checkFileImportType(configFilePath);
    if (typeImport === 'esm') {
      const pathCache = this.#cacheImportFile ? `?u=${Date.now()}` : '';
      const config = (await import(`${configFilePath}${pathCache}`)).default;
      return config;
    }
    // cjs import
    if (this.#cacheImportFile) {
      delete require.cache[configFilePath];
    }
    const config = await new Promise((resolve) => {
      // eslint-disable-next-line import/no-dynamic-require, no-promise-executor-return
      return resolve(require(`${configFilePath}`));
    });
    return config?.default || config;
  }

  // eslint-disable-next-line class-methods-use-this
  #checkFileImportType(configFilePath) {
    const file = readFileSync(configFilePath, 'utf8');
    if (file?.includes('export default')) {
      return 'esm';
    }
    return 'cjs';
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
}

export default NetworkListContext;
