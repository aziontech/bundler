/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc. and Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

import { Buffer } from 'buffer';
import { join, relative, resolve } from 'path';
import { format as formatUrl } from 'url';

// imports user project dependencies (node_modules)
/* eslint-disable */
import {
  APP_PATHS_MANIFEST,
  BUILD_ID_FILE,
  CLIENT_PUBLIC_FILES_PATH,
  CLIENT_STATIC_FILES_PATH,
  CLIENT_STATIC_FILES_RUNTIME,
  PAGES_MANIFEST,
  PRERENDER_MANIFEST,
  ROUTES_MANIFEST,
  SERVER_DIRECTORY,
  SERVERLESS_DIRECTORY,
} from 'next/constants';
import isError from 'next/dist/lib/is-error';
import { apiResolver, parseBody } from 'next/dist/server/api-utils/node';
import BaseServer, { NoFallbackError } from 'next/dist/server/base-server';
import { renderToHTML } from 'next/dist/server/render';
import { addRequestMeta } from 'next/dist/server/request-meta';
import { sendRenderResult } from 'next/dist/server/send-payload';
import {
  createHeaderRoute,
  createRedirectRoute,
  getCustomRoute,
  stringifyQuery,
} from 'next/dist/server/server-route-utils';
import { normalizePagePath } from 'next/dist/shared/lib/page-path/normalize-page-path';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import { prepareDestination } from 'next/dist/shared/lib/router/utils/prepare-destination';
import { PageNotFoundError } from 'next/dist/shared/lib/utils';
import { getClonableBody } from 'next/dist/server/body-streams';
import { isTargetLikeServerless } from 'next/dist/server/utils';
import { detectDomainLocale } from 'next/dist/shared/lib/i18n/detect-domain-locale';
import { normalizeLocalePath } from 'next/dist/shared/lib/i18n/normalize-locale-path';
import { isDynamicRoute } from 'next/dist/shared/lib/router/utils';
import { normalizeAppPath } from 'next/dist/shared/lib/router/utils/app-paths';
import getRouteFromAssetPath from 'next/dist/shared/lib/router/utils/get-route-from-asset-path';
import { removeTrailingSlash } from 'next/dist/shared/lib/router/utils/remove-trailing-slash';
/* eslint-enable */

/* eslint-disable no-underscore-dangle */

import getBackendInfo from './compute-js.js';
import loadComponents from './load-components.js';
import {
  assetDirectory,
  assetDirectoryExists,
  assetFileExists,
  getPagePath,
  readAssetFileAsString,
  readAssetManifest,
  readAssetModule,
  requireFontManifest,
} from './require.js';
import ComputeJsResponseCache from './response-cache/index.js';
import serveStatic from './serve-static.js';

/**
 * Hardcoded every possible error status code that could be thrown by "serveStatic" method
 * This is done by searching "this.error" inside "send" module's source code:
 * https://github.com/pillarjs/send/blob/master/index.js
 * https://github.com/pillarjs/send/blob/develop/index.js
 */
const POSSIBLE_ERROR_CODE_FROM_SERVE_STATIC = new Set([
  // send module will throw 500 when header is already sent or fs.stat error happens
  // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L392
  // Note: we will use Next.js built-in 500 page to handle 500 errors
  // 500,

  // send module will throw 404 when file is missing
  // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L421
  // Note: we will use Next.js built-in 404 page to handle 404 errors
  // 404,

  // send module will throw 403 when redirecting to a directory without enabling directory listing
  // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L484
  // Note: Next.js throws a different error (without status code) for directory listing
  // 403,

  // send module will throw 400 when fails to normalize the path
  // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L520
  400,

  // send module will throw 412 with conditional GET request
  // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L632
  412,

  // send module will throw 416 when range is not satisfiable
  // https://github.com/pillarjs/send/blob/53f0ab476145670a9bdd3dc722ab2fdc8d358fc6/index.js#L669
  416,
]);

/**
 * An implementation of a Next.js server that has been adapted to run in Compute@Edge.
 * (An adaptation for Compute@Edge of NextNodeServer in Next.js,
 * found at next/server/next-server.ts)
 */
export default class NextComputeJsServer extends BaseServer {
  constructor(options) {
    super(options);

    /**
     * This sets environment variable to be used at the time of SSR by head.tsx.
     * Using this from process.env allows targeting both serverless and SSR by calling
     * `process.env.__NEXT_OPTIMIZE_CSS`.
     */
    if (this.renderOpts.optimizeFonts) {
      process.env.__NEXT_OPTIMIZE_FONTS = JSON.stringify(true);
    }
    if (this.renderOpts.optimizeCss) {
      process.env.__NEXT_OPTIMIZE_CSS = JSON.stringify(true);
    }
    if (this.renderOpts.nextScriptWorkers) {
      process.env.__NEXT_SCRIPT_WORKERS = JSON.stringify(true);
    }

    // pre-warm _document and _app as these will be
    // needed for most requests
    loadComponents(
      this.serverOptions.computeJs.assets,
      this.distDir,
      '/_document',
      this.dir,
      this._isLikeServerless,
      false,
      false,
    ).catch(() => {});

    loadComponents(
      this.serverOptions.computeJs.assets,
      this.distDir,
      '/_app',
      this.dir,
      this._isLikeServerless,
      false,
      false,
    ).catch(() => {});

    this.compression =
      this.nextConfig.compress && this.nextConfig.target === 'server';
  }

  // eslint-disable-next-line
  loadEnvConfig(params) {
    // NOTE: No ENV in Fastly Compute@Edge, at least for now
  }

  // eslint-disable-next-line
  getResponseCache() {
    return new ComputeJsResponseCache();
  }

  getPublicDir() {
    return join(this.dir, CLIENT_PUBLIC_FILES_PATH);
  }

  getHasStaticDir() {
    return assetDirectoryExists(
      this.serverOptions.computeJs.assets,
      join(this.dir, 'static'),
      this.dir,
    );
  }

  getPagesManifest() {
    const pagesManifestFile = join(this.serverDistDir, PAGES_MANIFEST);
    return readAssetManifest(
      this.serverOptions.computeJs.assets,
      pagesManifestFile,
      this.dir,
    );
  }

  getAppPathsManifest() {
    if (this.nextConfig.experimental.appDir) {
      const appPathsManifestPath = join(this.serverDistDir, APP_PATHS_MANIFEST);
      return readAssetManifest(
        this.serverOptions.computeJs.assets,
        appPathsManifestPath,
        this.dir,
      );
    }
    return undefined;
  }

  async hasPage(pathname) {
    let found = false;
    try {
      found = !!this.getPagePath(pathname, this.nextConfig.i18n?.locales);
    } catch (_) {
      /* empty */
    }

    return found;
  }

  getBuildId() {
    const buildIdFile = join(this.distDir, BUILD_ID_FILE);

    try {
      const content = readAssetFileAsString(
        this.serverOptions.computeJs.assets,
        buildIdFile,
        this.dir,
      );
      return content.trim();
    } catch (err) {
      if (
        !assetFileExists(
          this.serverOptions.computeJs.assets,
          buildIdFile,
          this.dir,
        )
      ) {
        throw new Error(
          `Could not find a production build in the '${this.distDir}' directory. Try building your app with 'next build' before starting the production server. https://nextjs.org/docs/messages/production-start-no-build-id`,
        );
      }
      throw err;
    }
  }

  getCustomRoutes() {
    const customRoutes = this.getRoutesManifest();
    let rewrites;

    // rewrites can be stored as an array when an array is
    // returned in next.config.js so massage them into
    // the expected object format
    if (Array.isArray(customRoutes.rewrites)) {
      rewrites = {
        beforeFiles: [],
        afterFiles: customRoutes.rewrites,
        fallback: [],
      };
    } else {
      rewrites = customRoutes.rewrites;
    }
    return Object.assign(customRoutes, { rewrites });
  }

  // eslint-disable-next-line class-methods-use-this
  generateImageRoutes() {
    // TODO: Image Optimizer
    return [];
  }

  generateStaticRoutes() {
    return this.hasStaticDir
      ? [
          {
            // It's very important to keep this route's param optional.
            // (but it should support as many params as needed, separated by '/')
            // Otherwise this will lead to a pretty simple DOS attack.
            // See more: https://github.com/vercel/next.js/issues/2617
            match: getPathMatch('/static/:path*'),
            name: 'static catchall',
            fn: async (req, res, params, parsedUrl) => {
              const p = join(this.dir, 'static', ...params.path);
              await this.serveStatic(req, res, p, parsedUrl);
              return {
                finished: true,
              };
            },
          },
        ]
      : [];
  }

  // eslint-disable-next-line class-methods-use-this
  setImmutableAssetCacheControl(res) {
    res.setHeader('Cache-Control', ' max-age=31536000, immutable');
  }

  generateFsStaticRoutes() {
    return [
      {
        match: getPathMatch('/_next/static/:path*'),
        type: 'route',
        name: '_next/static catchall',
        fn: async (req, res, params, parsedUrl) => {
          // make sure to 404 for /_next/static itself
          if (!params.path) {
            await this.render404(req, res, parsedUrl);
            return {
              finished: true,
            };
          }

          if (
            params.path[0] === CLIENT_STATIC_FILES_RUNTIME ||
            params.path[0] === 'chunks' ||
            params.path[0] === 'css' ||
            params.path[0] === 'image' ||
            params.path[0] === 'media' ||
            params.path[0] === this.buildId ||
            params.path[0] === 'pages' ||
            params.path[1] === 'pages'
          ) {
            this.setImmutableAssetCacheControl(res);
          }
          const p = join(
            this.distDir,
            CLIENT_STATIC_FILES_PATH,
            ...(params.path || []),
          );
          await this.serveStatic(req, res, p, parsedUrl);
          return {
            finished: true,
          };
        },
      },
    ];
  }

  generatePublicRoutes() {
    const publicFiles = new Set(
      assetDirectory(
        this.serverOptions.computeJs.assets,
        this.publicDir,
        this.dir,
      ).map((p) => {
        const realPath = resolve(this.dir, `.${p}`);
        const relPath = relative(this.publicDir, realPath);
        return `/${encodeURI(relPath.replace(/\\/g, '/'))}`;
      }),
    );
    if (publicFiles.size === 0) {
      return [];
    }

    return [
      {
        match: getPathMatch('/:path*'),
        matchesBasePath: true,
        name: 'folder catchall',
        fn: async (req, res, params, parsedUrl) => {
          const pathParts = params.path || [];
          const { basePath } = this.nextConfig;

          // if basePath is defined require it be present
          if (basePath) {
            const basePathParts = basePath.split('/');
            // remove first empty value
            basePathParts.shift();

            if (!basePathParts.every((part, idx) => part === pathParts[idx])) {
              return { finished: false };
            }

            pathParts.splice(0, basePathParts.length);
          }

          let path = `/${pathParts.join('/')}`;

          if (!publicFiles.has(path)) {
            // In `next-dev-server.ts`, we ensure encoded paths match
            // decoded paths on the filesystem. So we need do the
            // opposite here: make sure decoded paths match encoded.
            path = encodeURI(path);
          }

          if (publicFiles.has(path)) {
            await this.serveStatic(
              req,
              res,
              join(this.publicDir, ...pathParts),
              parsedUrl,
            );
            return {
              finished: true,
            };
          }
          return {
            finished: false,
          };
        },
      },
    ];
  }

  _validFilesystemPathSet = null;

  getFilesystemPaths() {
    if (this._validFilesystemPathSet) {
      return this._validFilesystemPathSet;
    }

    let userFilesStatic = [];
    if (this.hasStaticDir) {
      userFilesStatic = assetDirectory(
        this.serverOptions.computeJs.assets,
        join(this.dir, 'static'),
        this.dir,
      );
    }

    let userFilesPublic = [];
    if (this.publicDir) {
      userFilesPublic = assetDirectory(
        this.serverOptions.computeJs.assets,
        join(this.dir, CLIENT_PUBLIC_FILES_PATH),
        this.dir,
      );
    }

    const nextFilesStatic = [];
    if (!this.minimalMode) {
      userFilesStatic = assetDirectory(
        this.serverOptions.computeJs.assets,
        join(this.distDir, 'static'),
        this.dir,
      );
    }

    // eslint-disable-next-line no-return-assign
    return (this._validFilesystemPathSet = new Set([
      ...nextFilesStatic,
      ...userFilesPublic,
      ...userFilesStatic,
    ]));
  }

  // eslint-disable-next-line class-methods-use-this
  async sendRenderResult(req, res, options) {
    const result = await sendRenderResult({
      req: req.originalRequest,
      res: res.originalResponse,
      ...options,
    });

    return result;
  }

  async sendStatic(req, res, path) {
    return serveStatic(
      this.serverOptions.computeJs.assets,
      req,
      res,
      path,
      this.dir,
    );
  }

  handleCompression(req, res) {
    if (this.compression) {
      res.compress = true;
    }
  }

  // eslint-disable-next-line
  async handleUpgrade(req, socket, head) {
    // TODO: Upgrade websocket? (use Fanout?)
  }

  async proxyRequest(req, res, srcParsedUrl) {
    const parsedUrl = srcParsedUrl;
    const { query } = parsedUrl;
    delete parsedUrl.query;
    parsedUrl.search = stringifyQuery(req, query);

    const target = formatUrl(parsedUrl);

    const backend = getBackendInfo(
      this.serverOptions.computeJs.backends,
      target,
    );
    if (backend == null) {
      // Unable to proxy, due to no backend
      throw new Error(`Backend not found for '${target}'`);
    }

    const headers = {};

    // Rewrite host header
    headers.host = new URL(backend.url).host;

    // XFF
    const url = new URL(req.url);
    const port = url.port || '443'; // C@E can only be on 443, except when running locally
    const proto = 'https'; // C@E can only be accessed via HTTPS

    const values = {
      for: req.client.address,
      port,
      proto,
    };

    // eslint-disable-next-line func-names
    ['for', 'port', 'proto'].forEach(function (header) {
      const arr = [];
      let strs = req.headers[`x-forwarded-${header}`];
      if (Array.isArray(strs)) {
        strs = strs.join(',');
      }
      if (strs) {
        arr.push(strs);
      }
      arr.push(values[header]);
      headers[`x-forwarded-${header}`] = arr.join(',');
    });

    const body = await parseBody(req.originalRequest, 0);

    // NOTE: Next.js uses a proxy timeout of 30s by default
    // configurable using this.nextConfig.experimental.proxyTimeout
    // In C@E we don't have a way of setting timeout

    // NOTE: Next.js tries to use WS if upgradeHead is true.

    const response = await fetch(backend.target, {
      backend: backend.name,
      method: req.method,
      headers,
      body,
      // eslint-disable-next-line no-undef
      cacheOverride: new CacheOverride('pass'),
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    res.originalResponse.end(buffer);

    return {
      finished: true,
    };
  }

  async runApi(req, res, srcQuery, params, page, builtPagePath) {
    // node's next-server would try to run this first as an edge function.
    // TODO: do that one day =)
    let query = srcQuery;

    const pageModule = await readAssetModule(
      this.serverOptions.computeJs.assets,
      builtPagePath,
      this.dir,
    );

    query = { ...query, ...params };

    delete query.__nextLocale;
    delete query.__nextDefaultLocale;

    // NOTE: NextNodeServer would try to run this as a serverless
    // it's hard to tell at this moment whether that is the right
    // thing to do for us
    // if (!this.renderOpts.dev && this._isLikeServerless) {
    //   if (typeof pageModule.default === 'function') {
    //     prepareServerlessUrl(req, query);
    //     await pageModule.default(req, res);
    //     return true;
    //   }
    // }

    await apiResolver(
      req.originalRequest,
      res.originalResponse,
      query,
      pageModule,
      {
        ...this.renderOpts.previewProps,
        // not implementing revalidate at this moment
        // internal config so is not typed
        trustHostHeader: this.nextConfig.experimental.trustHostHeader,
      },
      this.minimalMode,
      this.renderOpts.dev,
      page,
    );
    return true;
  }

  async renderHTML(req, res, pathname, query, srcRenderOpts) {
    const renderOpts = srcRenderOpts;

    // Due to the way we pass data by mutating `renderOpts`, we can't extend the
    // object here but only updating its `serverComponentManifest` field.
    // https://github.com/vercel/next.js/blob/df7cbd904c3bd85f399d1ce90680c0ecf92d2752/packages/next/server/render.tsx#L947-L952
    renderOpts.serverComponentManifest = this.serverComponentManifest;
    renderOpts.serverCSSManifest = this.serverCSSManifest;

    /*
    if (
      this.nextConfig.experimental.appDir &&
      (renderOpts.isAppPath || query.__flight__)
    ) {
      const isPagesDir = !renderOpts.isAppPath
      return appRenderToHTMLOrFlight(
        req.originalRequest,
        res.originalResponse,
        pathname,
        query,
        renderOpts,
        isPagesDir
      )
    }
     */

    return renderToHTML(
      req.originalRequest,
      res.originalResponse,
      pathname,
      query,
      renderOpts,
    );
  }

  // eslint-disable-next-line consistent-return
  async serveStatic(req, res, path, parsedUrl) {
    if (!this.isServeableUrl(path)) {
      return this.render404(req, res, parsedUrl);
    }

    if (!(req.method === 'GET' || req.method === 'HEAD')) {
      res.statusCode = 405;
      res.setHeader('Allow', ['GET', 'HEAD']);
      return this.renderError(null, req, res, path);
    }

    try {
      await this.sendStatic(req, res, path);
    } catch (error) {
      if (!isError(error)) throw error;
      const err = error;
      if (err.code === 'ENOENT' || err.statusCode === 404) {
        await this.render404(req, res, parsedUrl);
      } else if (
        typeof err.statusCode === 'number' &&
        POSSIBLE_ERROR_CODE_FROM_SERVE_STATIC.has(err.statusCode)
      ) {
        res.statusCode = err.statusCode;
        return this.renderError(err, req, res, path);
      } else {
        throw err;
      }
    }
  }

  isServeableUrl(untrustedFileUrl) {
    // This method mimics what the version of `send` we use does:
    // 1. decodeURIComponent:
    //    https://github.com/pillarjs/send/blob/0.17.1/index.js#L989
    //    https://github.com/pillarjs/send/blob/0.17.1/index.js#L518-L522
    // 2. resolve:
    //    https://github.com/pillarjs/send/blob/de073ed3237ade9ff71c61673a34474b30e5d45b/index.js#L561

    let decodedUntrustedFilePath;
    try {
      // (1) Decode the URL so we have the proper file name
      decodedUntrustedFilePath = decodeURIComponent(untrustedFileUrl);
    } catch {
      return false;
    }

    // (2) Resolve "up paths" to determine real request
    const untrustedFilePath = resolve(decodedUntrustedFilePath);

    // Check against the real filesystem paths
    const filesystemUrls = this.getFilesystemPaths();
    const resolved = relative(this.dir, untrustedFilePath);

    return filesystemUrls.has(`/${resolved}`);
  }

  // eslint-disable-next-line class-methods-use-this
  generateCatchAllMiddlewareRoute() {
    // TODO: Edge Functions / Middleware
    // These are challenging at the moment to run in C@E, because
    // Next.js builds middleware as edge functions, and edge functions
    // are built as "edge functions" meant to run in Vercel's runtime.
    return [];
  }

  generateRewrites({ restrictedRedirectPaths }) {
    let beforeFiles = [];
    let afterFiles = [];
    let fallback = [];

    if (!this.minimalMode) {
      const buildRewrite = (rewrite, check = true) => {
        const rewriteRoute = getCustomRoute({
          type: 'rewrite',
          rule: rewrite,
          restrictedRedirectPaths,
        });
        return {
          ...rewriteRoute,
          check,
          type: rewriteRoute.type,
          name: `Rewrite route ${rewriteRoute.source}`,
          match: rewriteRoute.match,
          matchesBasePath: true,
          matchesLocale: true,
          matchesLocaleAPIRoutes: true,
          matchesTrailingSlash: true,
          fn: async (req, res, params, parsedUrl, upgradeHead) => {
            const { newUrl, parsedDestination } = prepareDestination({
              appendParamsToQuery: true,
              destination: rewriteRoute.destination,
              params,
              query: parsedUrl.query,
            });

            // external rewrite, proxy it
            if (parsedDestination.protocol) {
              // This implementation uses fetch() and can only go to preregistered backends.
              // TODO: maybe we can use Dynamic Backends feature once it's available
              return this.proxyRequest(
                req,
                res,
                parsedDestination,
                upgradeHead,
              );
            }

            addRequestMeta(req, '_nextRewroteUrl', newUrl);
            addRequestMeta(req, '_nextDidRewrite', newUrl !== req.url);

            return {
              finished: false,
              pathname: newUrl,
              query: parsedDestination.query,
            };
          },
        };
      };

      if (Array.isArray(this.customRoutes.rewrites)) {
        afterFiles = this.customRoutes.rewrites.map((r) => buildRewrite(r));
      } else {
        beforeFiles = this.customRoutes.rewrites.beforeFiles.map((r) =>
          buildRewrite(r, false),
        );
        afterFiles = this.customRoutes.rewrites.afterFiles.map((r) =>
          buildRewrite(r),
        );
        fallback = this.customRoutes.rewrites.fallback.map((r) =>
          buildRewrite(r),
        );
      }
    }

    return {
      beforeFiles,
      afterFiles,
      fallback,
    };
  }

  getPagePath(pathname, locales) {
    return getPagePath(
      this.serverOptions.computeJs.assets,
      pathname,
      this.dir,
      this.distDir,
      this._isLikeServerless,
      this.renderOpts.dev,
      locales,
      this.nextConfig.experimental.appDir,
    );
  }

  async renderPageComponent(ctx, bubbleNoFallback) {
    // node's next-server would try to run this first as an edge function.
    // TODO: do that one day =)

    return super.renderPageComponent(ctx, bubbleNoFallback);
  }

  async findPageComponents({ pathname, query, params, isAppPath }) {
    let paths = [
      query.amp
        ? `${
            isAppPath ? normalizeAppPath(pathname) : normalizePagePath(pathname)
          }.amp`
        : null,
      pathname,
    ].filter(Boolean);

    if (query.__nextLocale) {
      paths = [
        ...paths.map(
          (path) => `/${query.__nextLocale}${path === '/' ? '' : path}`,
        ),
        ...paths,
      ];
    }

    const componentsPromises = paths.map(async (pagePath) => {
      try {
        const components = await loadComponents(
          this.serverOptions.computeJs.assets,
          this.distDir,
          pagePath,
          this.dir,
          !this.renderOpts.dev && this._isLikeServerless,
          !!this.renderOpts.serverComponents,
          isAppPath,
        );

        if (
          query.__nextLocale &&
          typeof components.Component === 'string' &&
          !pagePath?.startsWith(`/${query.__nextLocale}`)
        ) {
          // if loading a static HTML file the locale is required
          // to be present since all HTML files are output under their locale
          return null;
        }

        return {
          components,
          query: {
            ...(components.getStaticProps
              ? {
                  amp: query.amp,
                  __nextDataReq: query.__nextDataReq,
                  __nextLocale: query.__nextLocale,
                  __nextDefaultLocale: query.__nextDefaultLocale,
                  __flight__: query.__flight__,
                }
              : query),
            // For appDir params is excluded.
            ...((isAppPath ? {} : params) || {}),
          },
        };
      } catch (err) {
        // we should only not throw if we failed to find the page
        // in the pages-manifest
        if (!(err instanceof PageNotFoundError)) {
          throw err;
        }
        return null;
      }
    });

    const componentsResults = await Promise.all(componentsPromises);
    return componentsResults.find((result) => result !== null) || null;
  }

  getFontManifest() {
    return requireFontManifest(
      this.serverOptions.computeJs.assets,
      this.distDir,
      this.dir,
      this._isLikeServerless,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  getServerComponentManifest() {
    // TODO: If we want to support Server Components
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  getServerCSSManifest() {
    // TODO: If we want to support Server Components
    return undefined;
  }

  async getFallback(page) {
    const pagePath = normalizePagePath(page);
    const fullPagePath = join(this.serverDistDir, 'pages', `${pagePath}.html`);
    return readAssetFileAsString(
      this.serverOptions.computeJs.assets,
      fullPagePath,
      this.dir,
    );
  }

  generateRoutes() {
    const publicRoutes = this.generatePublicRoutes();
    const imageRoutes = this.generateImageRoutes();
    const staticFilesRoutes = this.generateStaticRoutes();

    const fsRoutes = [
      ...this.generateFsStaticRoutes(),
      {
        match: getPathMatch('/_next/data/:path*'),
        type: 'route',
        name: '_next/data catchall',
        check: true,
        fn: async (req, res, params, _srcParsedUrl) => {
          const _parsedUrl = _srcParsedUrl;
          // Make sure to 404 for /_next/data/ itself and
          // we also want to 404 if the buildId isn't correct
          if (!params.path || params.path[0] !== this.buildId) {
            await this.render404(req, res, _parsedUrl);
            return {
              finished: true,
            };
          }
          // remove buildId from URL
          params.path.shift();

          const lastParam = params.path[params.path.length - 1];

          // show 404 if it doesn't end with .json
          if (typeof lastParam !== 'string' || !lastParam.endsWith('.json')) {
            await this.render404(req, res, _parsedUrl);
            return {
              finished: true,
            };
          }

          // re-create page's pathname
          let pathname = `/${params.path.join('/')}`;
          pathname = getRouteFromAssetPath(pathname, '.json');

          // ensure trailing slash is normalized per config
          if (this.router.catchAllMiddleware[0]) {
            if (this.nextConfig.trailingSlash && !pathname.endsWith('/')) {
              pathname += '/';
            }
            if (
              !this.nextConfig.trailingSlash &&
              pathname.length > 1 &&
              pathname.endsWith('/')
            ) {
              pathname = pathname.substring(0, pathname.length - 1);
            }
          }

          if (this.nextConfig.i18n) {
            const { host } = req?.headers || {};
            // remove port from host and remove port if present
            const hostname = host?.split(':')[0].toLowerCase();
            const localePathResult = normalizeLocalePath(
              pathname,
              this.nextConfig.i18n.locales,
            );
            const { defaultLocale } =
              detectDomainLocale(this.nextConfig.i18n.domains, hostname) || {};

            let detectedLocale = '';

            if (localePathResult.detectedLocale) {
              pathname = localePathResult.pathname;
              detectedLocale = localePathResult.detectedLocale;
            }

            _parsedUrl.query.__nextLocale = detectedLocale;
            _parsedUrl.query.__nextDefaultLocale =
              defaultLocale || this.nextConfig.i18n.defaultLocale;

            if (!detectedLocale && !this.router.catchAllMiddleware[0]) {
              _parsedUrl.query.__nextLocale =
                _parsedUrl.query.__nextDefaultLocale;
              await this.render404(req, res, _parsedUrl);
              return { finished: true };
            }
          }

          return {
            pathname,
            query: { ..._parsedUrl.query, __nextDataReq: '1' },
            finished: false,
          };
        },
      },
      ...imageRoutes,
      {
        match: getPathMatch('/_next/:path*'),
        type: 'route',
        name: '_next catchall',
        // This path is needed because `render()` does a check for `/_next` and the calls the routing again
        fn: async (req, res, _params, parsedUrl) => {
          await this.render404(req, res, parsedUrl);
          return {
            finished: true,
          };
        },
      },
      ...publicRoutes,
      ...staticFilesRoutes,
    ];

    const restrictedRedirectPaths = this.nextConfig.basePath
      ? [`${this.nextConfig.basePath}/_next`]
      : ['/_next'];

    // Headers come very first
    const headers = this.minimalMode
      ? []
      : this.customRoutes.headers.map((rule) =>
          createHeaderRoute({ rule, restrictedRedirectPaths }),
        );

    const redirects = this.minimalMode
      ? []
      : this.customRoutes.redirects.map((rule) =>
          createRedirectRoute({ rule, restrictedRedirectPaths }),
        );

    const rewrites = this.generateRewrites({ restrictedRedirectPaths });
    const catchAllMiddleware = this.generateCatchAllMiddlewareRoute();

    const catchAllRoute = {
      match: getPathMatch('/:path*'),
      type: 'route',
      matchesLocale: true,
      name: 'Catchall render',
      fn: async (req, res, _params, srcParsedUrl) => {
        const parsedUrl = srcParsedUrl;
        let { pathname } = parsedUrl;
        const { query } = parsedUrl;

        if (!pathname) {
          throw new Error('pathname is undefined');
        }

        // next.js core assumes page path without trailing slash
        pathname = removeTrailingSlash(pathname);

        if (this.nextConfig.i18n) {
          const localePathResult = normalizeLocalePath(
            pathname,
            this.nextConfig.i18n?.locales,
          );

          if (localePathResult.detectedLocale) {
            pathname = localePathResult.pathname;
            parsedUrl.query.__nextLocale = localePathResult.detectedLocale;
          }
        }
        const bubbleNoFallback = !!query._nextBubbleNoFallback;

        if (pathname === '/api' || pathname.startsWith('/api/')) {
          delete query._nextBubbleNoFallback;

          const handled = await this.handleApiRequest(
            req,
            res,
            pathname,
            query,
          );
          if (handled) {
            return { finished: true };
          }
        }

        try {
          await this.render(req, res, pathname, query, parsedUrl, true);

          return {
            finished: true,
          };
        } catch (err) {
          if (err instanceof NoFallbackError && bubbleNoFallback) {
            return {
              finished: false,
            };
          }
          throw err;
        }
      },
    };

    const { useFileSystemPublicRoutes } = this.nextConfig;

    if (useFileSystemPublicRoutes) {
      this.appPathRoutes = this.getAppPathRoutes();
      this.dynamicRoutes = this.getDynamicRoutes();
    }

    return {
      headers,
      fsRoutes,
      rewrites,
      redirects,
      catchAllRoute,
      catchAllMiddleware,
      useFileSystemPublicRoutes,
      dynamicRoutes: this.dynamicRoutes,
      pageChecker: this.hasPage.bind(this),
      nextConfig: this.nextConfig,
    };
  }

  // Used to build API page in development
  // eslint-disable-next-line
  async ensureApiPage(_pathname) {}

  /**
   * Resolves `API` request, in development builds on demand
   * @param {object} req http request
   * @param {object} res http response
   * @param {string} pathname path of request
   * @param {string} query request query
   * @returns {Promise<boolean>} a promise indicating whether the page has been handled
   */
  async handleApiRequest(req, res, pathname, query) {
    let page = pathname;
    let params;
    let pageFound = !isDynamicRoute(page) && (await this.hasPage(page));

    if (!pageFound && this.dynamicRoutes) {
      for (let i = 0; i < this.dynamicRoutes.length; i++) {
        const dynamicRoute = this.dynamicRoutes[i];
        params = dynamicRoute.match(pathname) || undefined;
        if (dynamicRoute.page.startsWith('/api') && params) {
          page = dynamicRoute.page;
          pageFound = true;
          break;
        }
      }
    }

    if (!pageFound) {
      return false;
    }
    // Make sure the page is built before getting the path
    // or else it won't be in the manifest yet
    await this.ensureApiPage(page);

    let builtPagePath;
    try {
      builtPagePath = this.getPagePath(page);
    } catch (err) {
      if (isError(err) && err.code === 'ENOENT') {
        return false;
      }
      throw err;
    }

    return this.runApi(req, res, query, params, page, builtPagePath);
  }

  // We're going to use the time the build happened as the last modified time for the
  // sake of the cache file system for now.
  static _mtime = new Date();

  getCacheFilesystem() {
    return {
      readFile: (f) => {
        const content = readAssetFileAsString(
          this.serverOptions.computeJs.assets,
          f,
          this.dir,
        );
        return Promise.resolve(content);
      },
      readFileSync: (f) => {
        return readAssetFileAsString(
          this.serverOptions.computeJs.assets,
          f,
          this.dir,
        );
      },
      // eslint-disable-next-line no-unused-vars
      writeFile: (f, d) => {
        throw new Error('Writing to cache not currently supported');
      },
      // eslint-disable-next-line no-unused-vars
      mkdir: (dir) => {
        // writing to cache not currently supported, but silently succeed on mkdir for now
        return Promise.resolve();
      },
      // eslint-disable-next-line no-unused-vars
      stat: (f) => {
        return Promise.resolve({ mtime: NextComputeJsServer._mtime });
      },
    };
  }

  getPrerenderManifest() {
    if (this._cachedPreviewManifest) {
      return this._cachedPreviewManifest;
    }
    const manifestFile = join(this.distDir, PRERENDER_MANIFEST);
    const manifest = readAssetManifest(
      this.serverOptions.computeJs.assets,
      manifestFile,
      this.dir,
    );
    // eslint-disable-next-line no-return-assign
    return (this._cachedPreviewManifest = manifest);
  }

  getRoutesManifest() {
    const routesManifestFile = join(this.distDir, ROUTES_MANIFEST);
    return readAssetManifest(
      this.serverOptions.computeJs.assets,
      routesManifestFile,
      this.dir,
    );
  }

  attachRequestMeta(req, parsedUrl) {
    const protocol = req.originalRequest?.socket?.encrypted ? 'https' : 'http';

    // When there are hostname and port we build an absolute URL
    const initUrl =
      this.hostname && this.port
        ? `${protocol}://${this.hostname}:${this.port}${req.url}`
        : req.url;

    addRequestMeta(req, '__NEXT_INIT_URL', initUrl);
    addRequestMeta(req, '__NEXT_INIT_QUERY', { ...parsedUrl.query });
    addRequestMeta(req, '_protocol', protocol);
    addRequestMeta(req, '__NEXT_CLONABLE_BODY', getClonableBody(req.body));
  }

  get _isLikeServerless() {
    return isTargetLikeServerless(this.nextConfig.target);
  }

  get serverDistDir() {
    return join(
      this.distDir,
      this._isLikeServerless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY,
    );
  }
}
