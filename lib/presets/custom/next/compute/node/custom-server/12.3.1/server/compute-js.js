/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-syntax */
/**
 *
 * @param backends
 * @param url
 */
function findBackendInfo(backends, url) {
  for (const [backendName, backend] of Object.entries(backends)) {
    let backendUrl = typeof backend === 'string' ? backend : backend.url;
    if (!backendUrl.endsWith('/')) {
      backendUrl += '/';
    }
    if (url.startsWith(backendUrl)) {
      return {
        name: backendName,
        url: backendUrl,
        target: `/${url.slice(backendUrl.length)}`,
      };
    }
  }
  return null;
}

/**
 *
 * @param backends
 * @param url
 */
export function getBackendInfo(backends, url) {
  if (backends == null) {
    return null;
  }

  let backendName;

  const urlObj = new URL(url);
  if (urlObj.port === '') {
    // If port is not specified, try the default port
    if (urlObj.protocol === 'https:') {
      urlObj.port = '443';
    } else {
      urlObj.port = '80';
    }
    backendName = findBackendInfo(backends, String(urlObj));
  }
  if (backendName == null) {
    backendName = findBackendInfo(backends, url);
  }

  return backendName;
}
