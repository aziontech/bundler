/* eslint-disable */
globalThis.Azion = globalThis.Azion || {};

globalThis.Azion.networkList = {};
// unique context for each instance
const instanceNetworkList = new NETWORK_LIST_CONTEXT(false);

/**
 *
 * @param {string} network_list_id - The network list id
 * @param {string} value - The value to check
 * @returns
 */
globalThis.Azion.networkList.contains = (network_list_id, value) => {
  return instanceNetworkList.contains(network_list_id, value);
};
