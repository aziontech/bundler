import type { BundlerStore } from '#env';

/**
 * Updates the BundlerStore configuration based on resource names
 * @param currentConfig - Current BundlerStore configuration
 * @param newConfig - New configuration to be applied
 * @returns Updated BundlerStore configuration
 */
export function updateConfigByNames(
  currentConfig: BundlerStore,
  newConfig: BundlerStore,
): BundlerStore {
  const updatedConfig = { ...currentConfig };

  // Update Edge Functions
  if (newConfig.edgeFunctions?.length) {
    updatedConfig.edgeFunctions =
      currentConfig.edgeFunctions?.map((currentFn) => {
        const newFn = newConfig.edgeFunctions?.find((fn) => fn.name === currentFn.name);
        return newFn ? { ...currentFn, ...newFn } : currentFn;
      }) || [];
  }

  // Update Edge Applications
  if (newConfig.edgeApplications?.length) {
    updatedConfig.edgeApplications =
      currentConfig.edgeApplications?.map((currentApp) => {
        const newApp = newConfig.edgeApplications?.find((app) => app.name === currentApp.name);
        return newApp ? { ...currentApp, ...newApp } : currentApp;
      }) || [];
  }

  // Update Edge Storage
  if (newConfig.edgeStorage?.length) {
    updatedConfig.edgeStorage =
      currentConfig.edgeStorage?.map((currentStorage) => {
        const newStorage = newConfig.edgeStorage?.find(
          (storage) => storage.name === currentStorage.name,
        );
        return newStorage ? { ...currentStorage, ...newStorage } : currentStorage;
      }) || [];
  }

  // Update Edge Firewall
  if (newConfig.edgeFirewall?.length) {
    updatedConfig.edgeFirewall =
      currentConfig.edgeFirewall?.map((currentFirewall) => {
        const newFirewall = newConfig.edgeFirewall?.find(
          (firewall) => firewall.name === currentFirewall.name,
        );
        return newFirewall ? { ...currentFirewall, ...newFirewall } : currentFirewall;
      }) || [];
  }

  // Update Network List
  if (newConfig.networkList?.length) {
    updatedConfig.networkList =
      currentConfig.networkList?.map((currentList) => {
        const newList = newConfig.networkList?.find((list) => list.id === currentList.id);
        return newList ? { ...currentList, ...newList } : currentList;
      }) || [];
  }

  // Update WAF
  if (newConfig.waf?.length) {
    updatedConfig.waf =
      currentConfig.waf?.map((currentWaf) => {
        const newWaf = newConfig.waf?.find((waf) => waf.name === currentWaf.name);
        return newWaf ? { ...currentWaf, ...newWaf } : currentWaf;
      }) || [];
  }

  // Update Workloads
  if (newConfig.workloads?.length) {
    updatedConfig.workloads =
      currentConfig.workloads?.map((currentWorkload) => {
        const newWorkload = newConfig.workloads?.find(
          (workload) => workload.name === currentWorkload.name,
        );
        return newWorkload ? { ...currentWorkload, ...newWorkload } : currentWorkload;
      }) || [];
  }

  // Update Edge Connectors
  if (newConfig.edgeConnectors?.length) {
    updatedConfig.edgeConnectors =
      currentConfig.edgeConnectors?.map((currentConnector) => {
        const newConnector = newConfig.edgeConnectors?.find(
          (connector) => connector.name === currentConnector.name,
        );
        return newConnector ? { ...currentConnector, ...newConnector } : currentConnector;
      }) || [];
  }

  return updatedConfig;
}
