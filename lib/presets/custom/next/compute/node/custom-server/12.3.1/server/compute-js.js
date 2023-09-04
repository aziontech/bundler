"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBackendInfo = void 0;
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
                target: '/' + url.slice(backendUrl.length),
            };
        }
    }
    return null;
}
function getBackendInfo(backends, url) {
    if (backends == null) {
        return null;
    }
    let backendName;
    const urlObj = new URL(url);
    if (urlObj.port === '') {
        // If port is not specified, try the default port
        if (urlObj.protocol === 'https:') {
            urlObj.port = '443';
        }
        else {
            urlObj.port = '80';
        }
        backendName = findBackendInfo(backends, String(urlObj));
    }
    if (backendName == null) {
        backendName = findBackendInfo(backends, url);
    }
    return backendName;
}
exports.getBackendInfo = getBackendInfo;
//# sourceMappingURL=compute-js.js.map