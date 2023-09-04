"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc., licensed under the MIT license. See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadComponents = void 0;
const path_1 = require("path");
const constants_1 = require("next/constants");
const interop_default_1 = require("next/dist/lib/interop-default");
const require_1 = require("./require");
/**
 * Loads React component associated with a given pathname.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/load-components.ts)
 */
async function loadComponents(assets, distDir, pathname, dir, serverless, hasServerComponents, isAppPath) {
    if (serverless) {
        return {
            pageConfig: {},
            buildManifest: {},
            reactLoadableManifest: {},
            App: () => 'App',
            Component: () => 'Component',
            Document: () => 'Document',
            ComponentMod: () => 'ComponentMod',
        };
    }
    let DocumentMod = {};
    let AppMod = {};
    if (!isAppPath) {
        [DocumentMod, AppMod] = await Promise.all([
            Promise.resolve().then(() => (0, require_1.requirePage)(assets, '/_document', dir, distDir, serverless, false)),
            Promise.resolve().then(() => (0, require_1.requirePage)(assets, '/_app', dir, distDir, serverless, false)),
        ]);
    }
    const ComponentMod = await Promise.resolve().then(() => (0, require_1.requirePage)(assets, pathname, dir, distDir, serverless, isAppPath));
    const [buildManifest, reactLoadableManifest, serverComponentManifest] = await Promise.all([
        (0, require_1.readAssetManifest)(assets, (0, path_1.join)(distDir, constants_1.BUILD_MANIFEST), dir),
        (0, require_1.readAssetManifest)(assets, (0, path_1.join)(distDir, constants_1.REACT_LOADABLE_MANIFEST), dir),
        hasServerComponents
            ? (0, require_1.readAssetManifest)(assets, (0, path_1.join)(distDir, 'server', constants_1.FLIGHT_MANIFEST + '.json'), dir)
            : null,
    ]);
    const Component = (0, interop_default_1.interopDefault)(ComponentMod);
    const Document = (0, interop_default_1.interopDefault)(DocumentMod);
    const App = (0, interop_default_1.interopDefault)(AppMod);
    const { getServerSideProps, getStaticProps, getStaticPaths } = ComponentMod;
    return {
        App,
        Document,
        Component,
        buildManifest,
        reactLoadableManifest,
        pageConfig: ComponentMod.config || {},
        ComponentMod,
        getServerSideProps,
        getStaticProps,
        getStaticPaths,
        serverComponentManifest,
        isAppPath,
    };
}
exports.loadComponents = loadComponents;
//# sourceMappingURL=load-components.js.map