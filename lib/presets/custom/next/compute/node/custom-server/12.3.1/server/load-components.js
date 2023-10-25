/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc. and Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

import { join } from 'path';

// imports user project dependencies (node_modules)
/* eslint-disable */
import {
  BUILD_MANIFEST,
  FLIGHT_MANIFEST,
  REACT_LOADABLE_MANIFEST,
} from 'next/constants';
import { interopDefault } from 'next/dist/lib/interop-default';
/* eslint-enable */

import { readAssetManifest, requirePage } from './require.js';

/**
 * Loads React component associated with a given pathname.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/load-components.ts)
 * @param {Record<string, object>} assets assets infos (contentType, content, module, isStatic)
 * @param {string} distDir reference builded dir
 * @param {string} pathname page path name
 * @param {string} dir reference dir
 * @param {boolean} serverless indicates serverless mode
 * @param {boolean} hasServerComponents indicates that has server components
 * @param {boolean} isAppPath indicates that is a app path
 * @returns {Promise<object>} a promise with component infos
 */
export default async function loadComponents(
  assets,
  distDir,
  pathname,
  dir,
  serverless,
  hasServerComponents,
  isAppPath,
) {
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
      Promise.resolve().then(() =>
        requirePage(assets, '/_document', dir, distDir, serverless, false),
      ),
      Promise.resolve().then(() =>
        requirePage(assets, '/_app', dir, distDir, serverless, false),
      ),
    ]);
  }

  const ComponentMod = await Promise.resolve().then(() =>
    requirePage(assets, pathname, dir, distDir, serverless, isAppPath),
  );

  const [buildManifest, reactLoadableManifest, serverComponentManifest] =
    await Promise.all([
      readAssetManifest(assets, join(distDir, BUILD_MANIFEST), dir),
      readAssetManifest(assets, join(distDir, REACT_LOADABLE_MANIFEST), dir),
      hasServerComponents
        ? readAssetManifest(
            assets,
            join(distDir, 'server', `${FLIGHT_MANIFEST}.json`),
            dir,
          )
        : null,
    ]);

  const Component = interopDefault(ComponentMod);
  const Document = interopDefault(DocumentMod);
  const App = interopDefault(AppMod);

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
