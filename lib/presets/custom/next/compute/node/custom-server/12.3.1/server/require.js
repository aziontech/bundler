"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc., licensed under the MIT license. See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAssetModule = exports.readAssetManifest = exports.getAssetContentType = exports.readAssetFileAsString = exports.readAsyncAssetFile = exports.readAssetFile = exports.assetFileExists = exports.assetDirectory = exports.assetDirectoryExists = exports.requireFontManifest = exports.requirePage = exports.getPagePath = void 0;
const path_1 = require("path");
const buffer_1 = require("buffer");
const constants_1 = require("next/constants");
const normalize_locale_path_1 = require("next/dist/shared/lib/i18n/normalize-locale-path");
const denormalize_page_path_1 = require("next/dist/shared/lib/page-path/denormalize-page-path");
const normalize_page_path_1 = require("next/dist/shared/lib/page-path/normalize-page-path");
const utils_1 = require("next/dist/shared/lib/utils");
/**
 * Finds the path that corresponds to a page, based on the pages manifest and localizations.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 */
function getPagePath(assets, page, dir, distDir, serverless, dev, locales, appDirEnabled) {
    const serverBuildPath = (0, path_1.join)(distDir, serverless && !dev ? constants_1.SERVERLESS_DIRECTORY : constants_1.SERVER_DIRECTORY);
    let rootPathsManifest;
    if (appDirEnabled) {
        rootPathsManifest = readAssetManifest(assets, (0, path_1.join)(serverBuildPath, constants_1.APP_PATHS_MANIFEST), dir);
    }
    const pagesManifest = readAssetManifest(assets, (0, path_1.join)(serverBuildPath, constants_1.PAGES_MANIFEST), dir);
    try {
        page = (0, denormalize_page_path_1.denormalizePagePath)((0, normalize_page_path_1.normalizePagePath)(page));
    }
    catch (err) {
        console.error(err);
        throw new utils_1.PageNotFoundError(page);
    }
    const checkManifest = (manifest) => {
        let curPath = manifest[page];
        if (!manifest[curPath] && locales) {
            const manifestNoLocales = {};
            for (const key of Object.keys(manifest)) {
                manifestNoLocales[(0, normalize_locale_path_1.normalizeLocalePath)(key, locales).pathname] = pagesManifest[key];
            }
            curPath = manifestNoLocales[page];
        }
        return curPath;
    };
    let pagePath;
    if (rootPathsManifest) {
        pagePath = checkManifest(rootPathsManifest);
    }
    if (!pagePath) {
        pagePath = checkManifest(pagesManifest);
    }
    if (!pagePath) {
        throw new utils_1.PageNotFoundError(page);
    }
    return (0, path_1.join)(serverBuildPath, pagePath);
}
exports.getPagePath = getPagePath;
/**
 * Loads the string or module that corresponds to a page.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 */
async function requirePage(assets, page, dir, distDir, serverless, appDirEnabled) {
    const pagePath = getPagePath(assets, page, dir, distDir, serverless, false, undefined, appDirEnabled);
    if (pagePath.endsWith(".html")) {
        try {
            return readAssetFileAsString(assets, pagePath, dir);
        }
        catch (err) {
            throw new utils_1.MissingStaticPage(page, err.message);
        }
    }
    return readAssetModule(assets, pagePath, dir);
}
exports.requirePage = requirePage;
/**
 * Load the font manifest.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 */
function requireFontManifest(assets, distDir, dir, serverless) {
    const serverBuildPath = (0, path_1.join)(distDir, serverless ? constants_1.SERVERLESS_DIRECTORY : constants_1.SERVER_DIRECTORY);
    return readAssetManifest(assets, (0, path_1.join)(serverBuildPath, constants_1.FONT_MANIFEST), dir);
}
exports.requireFontManifest = requireFontManifest;
/* ---- */
function assetDirectoryExists(assets, path, dir) {
    const relativePath = (0, path_1.relative)(dir, path);
    return Object.keys(assets).some((key) => key.startsWith("/" + relativePath + "/"));
}
exports.assetDirectoryExists = assetDirectoryExists;
function assetDirectory(assets, path, dir) {
    const relativePath = (0, path_1.relative)(dir, path);
    return Object.keys(assets).filter((key) => key.startsWith("/" + relativePath + "/"));
}
exports.assetDirectory = assetDirectory;
function assetFileExists(assets, path, dir) {
    const relativePath = (0, path_1.relative)(dir, path);
    return "/" + relativePath in assets;
}
exports.assetFileExists = assetFileExists;
function readAssetFile(assets, path, dir) {
    const relativePath = (0, path_1.relative)(dir, path);
    const file = assets["/" + relativePath];
    let buff = new buffer_1.Buffer(file.content, "base64");
    return buff;
}
exports.readAssetFile = readAssetFile;
async function readAsyncAssetFile(assets, path, dir) {
    const relativePath = (0, path_1.relative)(dir, path);
    const file = assets["/" + relativePath];
    const urlOBJ = new URL(`${file.content}`, "file://");
    const response = await fetch(`${urlOBJ}`);
    if (!response.ok) {
        throw new Error("Error loading file.");
    }
    const buffer = await response.arrayBuffer();
    return Promise.resolve(new Uint8Array(buffer));
}
exports.readAsyncAssetFile = readAsyncAssetFile;
function readAssetFileAsString(assets, path, dir) {
    let content = readAssetFile(assets, path, dir);
    if (typeof content !== "string") {
        content = content.toString("utf8");
    }
    return content;
}
exports.readAssetFileAsString = readAssetFileAsString;
function getAssetContentType(assets, path, dir) {
    const relativePath = (0, path_1.relative)(dir, path);
    const file = assets["/" + relativePath];
    return file.contentType;
}
exports.getAssetContentType = getAssetContentType;
function readAssetManifest(assets, path, dir) {
    let content = readAssetFileAsString(assets, path, dir);
    return JSON.parse(content);
}
exports.readAssetManifest = readAssetManifest;
function readAssetModule(assets, path, dir) {
    const relativePath = (0, path_1.relative)(dir, path);
    const file = assets["/" + relativePath];
    return file.module;
}
exports.readAssetModule = readAssetModule;
//# sourceMappingURL=require.js.map