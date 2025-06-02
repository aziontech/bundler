import type { BundlerStore } from '#env';
import { feedback } from 'azion/utils/node';

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
    const updatedFunctions =
      currentConfig.edgeFunctions?.map((currentFn) => {
        const newFn = newConfig.edgeFunctions?.find((fn) => fn.name === currentFn.name);
        return newFn ? { ...currentFn, ...newFn } : currentFn;
      }) || [];

    // Add new functions that don't exist in current config
    newConfig.edgeFunctions?.forEach((newFn) => {
      const exists = currentConfig.edgeFunctions?.some(
        (currentFn) => currentFn.name === newFn.name,
      );
      if (!exists) {
        updatedFunctions.push(newFn);
        feedback.info(
          `Edge Function "${newFn.name}" not found in current configuration. Adding as new.`,
        );
      }
    });

    updatedConfig.edgeFunctions = updatedFunctions;
  }

  // Update Edge Applications
  if (newConfig.edgeApplications?.length) {
    const updatedApplications =
      currentConfig.edgeApplications?.map((currentApp) => {
        const newApp = newConfig.edgeApplications?.find((app) => app.name === currentApp.name);
        return newApp ? { ...currentApp, ...newApp } : currentApp;
      }) || [];

    // Add new applications that don't exist in current config
    newConfig.edgeApplications?.forEach((newApp) => {
      const exists = currentConfig.edgeApplications?.some(
        (currentApp) => currentApp.name === newApp.name,
      );
      if (!exists) {
        updatedApplications.push(newApp);
        feedback.info(
          `Edge Application "${newApp.name}" not found in current configuration. Adding as new.`,
        );
      }
    });

    updatedConfig.edgeApplications = updatedApplications;
  }

  // Update Edge Storage
  if (newConfig.edgeStorage?.length) {
    const updatedStorage =
      currentConfig.edgeStorage?.map((currentStorage) => {
        const newStorage = newConfig.edgeStorage?.find(
          (storage) => storage.name === currentStorage.name,
        );
        return newStorage ? { ...currentStorage, ...newStorage } : currentStorage;
      }) || [];

    // Add new storage that don't exist in current config
    newConfig.edgeStorage?.forEach((newStorage) => {
      const exists = currentConfig.edgeStorage?.some(
        (currentStorage) => currentStorage.name === newStorage.name,
      );
      if (!exists) {
        updatedStorage.push(newStorage);
        feedback.info(
          `Edge Storage "${newStorage.name}" not found in current configuration. Adding as new.`,
        );
      }
    });

    updatedConfig.edgeStorage = updatedStorage;
  }

  // Update Edge Firewall
  if (newConfig.edgeFirewall?.length) {
    const updatedFirewalls =
      currentConfig.edgeFirewall?.map((currentFirewall) => {
        const newFirewall = newConfig.edgeFirewall?.find(
          (firewall) => firewall.name === currentFirewall.name,
        );
        return newFirewall ? { ...currentFirewall, ...newFirewall } : currentFirewall;
      }) || [];

    // Add new firewalls that don't exist in current config
    newConfig.edgeFirewall?.forEach((newFirewall) => {
      const exists = currentConfig.edgeFirewall?.some(
        (currentFirewall) => currentFirewall.name === newFirewall.name,
      );
      if (!exists) {
        updatedFirewalls.push(newFirewall);
        feedback.info(
          `Edge Firewall "${newFirewall.name}" not found in current configuration. Adding as new.`,
        );
      }
    });

    updatedConfig.edgeFirewall = updatedFirewalls;
  }

  // Update Network List
  if (newConfig.networkList?.length) {
    const updatedNetworkLists =
      currentConfig.networkList?.map((currentList) => {
        const newList = newConfig.networkList?.find((list) => list.id === currentList.id);
        return newList ? { ...currentList, ...newList } : currentList;
      }) || [];

    // Add new network lists that don't exist in current config
    newConfig.networkList?.forEach((newList) => {
      const exists = currentConfig.networkList?.some(
        (currentList) => currentList.id === newList.id,
      );
      if (!exists) {
        updatedNetworkLists.push(newList);
        feedback.info(
          `Network List with ID "${newList.id}" not found in current configuration. Adding as new.`,
        );
      }
    });

    updatedConfig.networkList = updatedNetworkLists;
  }

  // Update WAF
  if (newConfig.waf?.length) {
    const updatedWafs =
      currentConfig.waf?.map((currentWaf) => {
        const newWaf = newConfig.waf?.find((waf) => waf.name === currentWaf.name);
        return newWaf ? { ...currentWaf, ...newWaf } : currentWaf;
      }) || [];

    // Add new WAFs that don't exist in current config
    newConfig.waf?.forEach((newWaf) => {
      const exists = currentConfig.waf?.some((currentWaf) => currentWaf.name === newWaf.name);
      if (!exists) {
        updatedWafs.push(newWaf);
        feedback.info(`WAF "${newWaf.name}" not found in current configuration. Adding as new.`);
      }
    });

    updatedConfig.waf = updatedWafs;
  }

  // Update Workloads
  if (newConfig.workloads?.length) {
    const updatedWorkloads =
      currentConfig.workloads?.map((currentWorkload) => {
        const newWorkload = newConfig.workloads?.find(
          (workload) => workload.name === currentWorkload.name,
        );
        return newWorkload ? { ...currentWorkload, ...newWorkload } : currentWorkload;
      }) || [];

    // Add new workloads that don't exist in current config
    newConfig.workloads?.forEach((newWorkload) => {
      const exists = currentConfig.workloads?.some(
        (currentWorkload) => currentWorkload.name === newWorkload.name,
      );
      if (!exists) {
        updatedWorkloads.push(newWorkload);
        feedback.info(
          `Workload "${newWorkload.name}" not found in current configuration. Adding as new.`,
        );
      }
    });

    updatedConfig.workloads = updatedWorkloads;
  }

  // Update Edge Connectors
  if (newConfig.edgeConnectors?.length) {
    const updatedConnectors =
      currentConfig.edgeConnectors?.map((currentConnector) => {
        const newConnector = newConfig.edgeConnectors?.find(
          (connector) => connector.name === currentConnector.name,
        );
        return newConnector ? { ...currentConnector, ...newConnector } : currentConnector;
      }) || [];

    // Add new connectors that don't exist in current config
    newConfig.edgeConnectors?.forEach((newConnector) => {
      const exists = currentConfig.edgeConnectors?.some(
        (currentConnector) => currentConnector.name === newConnector.name,
      );
      if (!exists) {
        updatedConnectors.push(newConnector);
        feedback.info(
          `Edge Connector "${newConnector.name}" not found in current configuration. Adding as new.`,
        );
      }
    });

    updatedConfig.edgeConnectors = updatedConnectors;
  }

  return updatedConfig;
}
