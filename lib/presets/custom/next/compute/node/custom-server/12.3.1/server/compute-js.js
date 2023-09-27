/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

/**
 * Find backend infos (name, url, target) in backends
 * @param {Record<string, string | object>} backends backend infos
 * @param {string} url the application url
 * @returns {object | null} backend infos (name, url, target)
 */
function findBackendInfo(backends, url) {
  const entries = Object.entries(backends);
  for (let i = 0; i < entries.length; i++) {
    const [backendName, backend] = entries[i];
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
 * Return backend infos (name, url, target)
 * @param {Record<string, string | object> | undefined} backends backend infos
 * @param {string} url the application url
 * @returns {object | null} backend infos (name, url, target)
 */
export default function getBackendInfo(backends, url) {
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
