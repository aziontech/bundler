'use strict';
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc., licensed under the MIT license. See LICENSE file for details.
 */
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod) if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const buffer_1 = require('buffer');
const path_1 = require('path');
const url_1 = require('url');
const constants_1 = require('next/constants');
const is_error_1 = __importDefault(require('next/dist/lib/is-error'));
const node_1 = require('next/dist/server/api-utils/node');
const base_server_1 = __importStar(require('next/dist/server/base-server'));
const request_meta_1 = require('next/dist/server/request-meta');
const render_1 = require('next/dist/server/render');
const send_payload_1 = require('next/dist/server/send-payload');
const server_route_utils_1 = require('next/dist/server/server-route-utils');
const normalize_page_path_1 = require('next/dist/shared/lib/page-path/normalize-page-path');
const path_match_1 = require('next/dist/shared/lib/router/utils/path-match');
const prepare_destination_1 = require('next/dist/shared/lib/router/utils/prepare-destination');
const utils_1 = require('next/dist/shared/lib/utils');
const compute_js_1 = require('./compute-js');
const require_1 = require('./require');
const load_components_1 = require('./load-components');
const serve_static_1 = require('./serve-static');
const body_streams_1 = require('next/dist/server/body-streams');
const utils_2 = require('next/dist/server/utils');
// import ResponseCache from "next/dist/server/response-cache";
// import { IncrementalCache } from "next/dist/server/lib/incremental-cache";
const app_paths_1 = require('next/dist/shared/lib/router/utils/app-paths');
const get_route_from_asset_path_1 = __importDefault(require('next/dist/shared/lib/router/utils/get-route-from-asset-path'));
const normalize_locale_path_1 = require('next/dist/shared/lib/i18n/normalize-locale-path');
const detect_domain_locale_1 = require('next/dist/shared/lib/i18n/detect-domain-locale');
const remove_trailing_slash_1 = require('next/dist/shared/lib/router/utils/remove-trailing-slash');
const utils_3 = require('next/dist/shared/lib/router/utils');
const response_cache_1 = __importDefault(require('./response-cache'));
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
class NextComputeJsServer extends base_server_1.default {
  constructor(options) {
    super(options);
    this.compression = this.nextConfig.compress && this.nextConfig.target === 'server';
    this._validFilesystemPathSet = null;
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
    (0, load_components_1.loadComponents)(
      this.serverOptions.computeJs.assets,
      this.distDir,
      '/_document',
      this.dir,
      this._isLikeServerless,
      false,
      false
    ).catch(() => {});
    (0, load_components_1.loadComponents)(
      this.serverOptions.computeJs.assets,
      this.distDir,
      '/_app',
      this.dir,
      this._isLikeServerless,
      false,
      false
    ).catch(() => {});
  }
  loadEnvConfig(params) {
    // NOTE: No ENV in Fastly Compute@Edge, at least for now
  }
  getResponseCache() {
    return new response_cache_1.default();
  }
  getPublicDir() {
    return (0, path_1.join)(this.dir, constants_1.CLIENT_PUBLIC_FILES_PATH);
  }
  getHasStaticDir() {
    return (0, require_1.assetDirectoryExists)(this.serverOptions.computeJs.assets, (0, path_1.join)(this.dir, 'static'), this.dir);
  }
  getPagesManifest() {
    const pagesManifestFile = (0, path_1.join)(this.serverDistDir, constants_1.PAGES_MANIFEST);
    return (0, require_1.readAssetManifest)(this.serverOptions.computeJs.assets, pagesManifestFile, this.dir);
  }
  getAppPathsManifest() {
    if (this.nextConfig.experimental.appDir) {
      const appPathsManifestPath = (0, path_1.join)(this.serverDistDir, constants_1.APP_PATHS_MANIFEST);
      return (0, require_1.readAssetManifest)(this.serverOptions.computeJs.assets, appPathsManifestPath, this.dir);
    }
    return undefined;
  }
  async hasPage(pathname) {
    var _a;
    let found = false;
    try {
      found = !!this.getPagePath(pathname, (_a = this.nextConfig.i18n) === null || _a === void 0 ? void 0 : _a.locales);
    } catch (_) {}
    return found;
  }
  getBuildId() {
    const buildIdFile = (0, path_1.join)(this.distDir, constants_1.BUILD_ID_FILE);
    try {
      const content = (0, require_1.readAssetFileAsString)(this.serverOptions.computeJs.assets, buildIdFile, this.dir);
      return content.trim();
    } catch (err) {
      if (!(0, require_1.assetFileExists)(this.serverOptions.computeJs.assets, buildIdFile, this.dir)) {
        throw new Error(
          `Could not find a production build in the '${this.distDir}' directory. Try building your app with 'next build' before starting the production server. https://nextjs.org/docs/messages/production-start-no-build-id`
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
            match: (0, path_match_1.getPathMatch)('/static/:path*'),
            name: 'static catchall',
            fn: async (req, res, params, parsedUrl) => {
              const p = (0, path_1.join)(this.dir, 'static', ...params.path);
              await this.serveStatic(req, res, p, parsedUrl);
              return {
                finished: true,
              };
            },
          },
        ]
      : [];
  }
  setImmutableAssetCacheControl(res) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  generateFsStaticRoutes() {
    return [
      {
        match: (0, path_match_1.getPathMatch)('/_next/static/:path*'),
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
            params.path[0] === constants_1.CLIENT_STATIC_FILES_RUNTIME ||
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
          const p = (0, path_1.join)(this.distDir, constants_1.CLIENT_STATIC_FILES_PATH, ...(params.path || []));
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
      (0, require_1.assetDirectory)(this.serverOptions.computeJs.assets, this.publicDir, this.dir).map((p) => {
        const realPath = (0, path_1.resolve)(this.dir, '.' + p);
        const relPath = (0, path_1.relative)(this.publicDir, realPath);
        return '/' + encodeURI(relPath.replace(/\\/g, '/'));
      })
    );
    if (publicFiles.size === 0) {
      return [];
    }
    return [
      {
        match: (0, path_match_1.getPathMatch)('/:path*'),
        matchesBasePath: true,
        name: 'public folder catchall',
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
            await this.serveStatic(req, res, (0, path_1.join)(this.publicDir, ...pathParts), parsedUrl);
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
  getFilesystemPaths() {
    if (this._validFilesystemPathSet) {
      return this._validFilesystemPathSet;
    }
    let userFilesStatic = [];
    if (this.hasStaticDir) {
      userFilesStatic = (0, require_1.assetDirectory)(this.serverOptions.computeJs.assets, (0, path_1.join)(this.dir, 'static'), this.dir);
    }
    let userFilesPublic = [];
    if (this.publicDir) {
      userFilesPublic = (0, require_1.assetDirectory)(
        this.serverOptions.computeJs.assets,
        (0, path_1.join)(this.dir, constants_1.CLIENT_PUBLIC_FILES_PATH),
        this.dir
      );
    }
    let nextFilesStatic = [];
    if (!this.minimalMode) {
      userFilesStatic = (0, require_1.assetDirectory)(
        this.serverOptions.computeJs.assets,
        (0, path_1.join)(this.distDir, 'static'),
        this.dir
      );
    }
    return (this._validFilesystemPathSet = new Set([...nextFilesStatic, ...userFilesPublic, ...userFilesStatic]));
  }
  async sendRenderResult(req, res, options) {
    return await (0, send_payload_1.sendRenderResult)({
      req: req.originalRequest,
      res: res.originalResponse,
      ...options,
    });
  }
  async sendStatic(req, res, path) {
    return (0, serve_static_1.serveStatic)(this.serverOptions.computeJs.assets, req, res, path, this.dir);
  }
  handleCompression(req, res) {
    if (this.compression) {
      res.compress = true;
    }
  }
  async handleUpgrade(req, socket, head) {
    // TODO: Upgrade websocket? (use Fanout?)
  }
  async proxyRequest(req, res, parsedUrl, upgradeHead) {
    const { query } = parsedUrl;
    delete parsedUrl.query;
    parsedUrl.search = (0, server_route_utils_1.stringifyQuery)(req, query);
    const target = (0, url_1.format)(parsedUrl);
    const backend = (0, compute_js_1.getBackendInfo)(this.serverOptions.computeJs.backends, target);
    if (backend == null) {
      // Unable to proxy, due to no backend
      throw new Error(`Backend not found for '${target}'`);
    }
    const headers = {};
    // Rewrite host header
    headers['host'] = new URL(backend.url).host;
    // XFF
    const url = new URL(req.url);
    const port = url.port || '443'; // C@E can only be on 443, except when running locally
    const proto = 'https'; // C@E can only be accessed via HTTPS
    const values = {
      for: req.client.address,
      port,
      proto,
    };
    ['for', 'port', 'proto'].forEach(function (header) {
      const arr = [];
      let strs = req.headers['x-forwarded-' + header];
      if (Array.isArray(strs)) {
        strs = strs.join(',');
      }
      if (strs) {
        arr.push(strs);
      }
      arr.push(values[header]);
      headers['x-forwarded-' + header] = arr.join(',');
    });
    const body = await (0, node_1.parseBody)(req.originalRequest, 0);
    // NOTE: Next.js uses a proxy timeout of 30s by default
    // configurable using this.nextConfig.experimental.proxyTimeout
    // In C@E we don't have a way of setting timeout
    // NOTE: Next.js tries to use WS if upgradeHead is true.
    const response = await fetch(backend.target, {
      backend: backend.name,
      method: req.method,
      headers,
      body: body,
      cacheOverride: new CacheOverride('pass'),
    });
    const buffer = buffer_1.Buffer.from(await response.arrayBuffer());
    res.statusCode = response.status;
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    res.originalResponse.end(buffer);
    return {
      finished: true,
    };
  }
  async runApi(req, res, query, params, page, builtPagePath) {
    // node's next-server would try to run this first as an edge function.
    // TODO: do that one day =)
    const pageModule = await (0, require_1.readAssetModule)(this.serverOptions.computeJs.assets, builtPagePath, this.dir);
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
    await (0, node_1.apiResolver)(
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
      page
    );
    return true;
  }
  async renderHTML(req, res, pathname, query, renderOpts) {
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
    return (0, render_1.renderToHTML)(req.originalRequest, res.originalResponse, pathname, query, renderOpts);
  }
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
      if (!(0, is_error_1.default)(error)) throw error;
      const err = error;
      if (err.code === 'ENOENT' || err.statusCode === 404) {
        await this.render404(req, res, parsedUrl);
      } else if (typeof err.statusCode === 'number' && POSSIBLE_ERROR_CODE_FROM_SERVE_STATIC.has(err.statusCode)) {
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
    } catch (_a) {
      return false;
    }
    // (2) Resolve "up paths" to determine real request
    const untrustedFilePath = (0, path_1.resolve)(decodedUntrustedFilePath);
    // Check against the real filesystem paths
    const filesystemUrls = this.getFilesystemPaths();
    const resolved = (0, path_1.relative)(this.dir, untrustedFilePath);
    return filesystemUrls.has('/' + resolved);
  }
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
        const rewriteRoute = (0, server_route_utils_1.getCustomRoute)({
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
            const { newUrl, parsedDestination } = (0, prepare_destination_1.prepareDestination)({
              appendParamsToQuery: true,
              destination: rewriteRoute.destination,
              params: params,
              query: parsedUrl.query,
            });
            // external rewrite, proxy it
            if (parsedDestination.protocol) {
              // This implementation uses fetch() and can only go to preregistered backends.
              // TODO: maybe we can use Dynamic Backends feature once it's available
              return this.proxyRequest(req, res, parsedDestination, upgradeHead);
            }
            (0, request_meta_1.addRequestMeta)(req, '_nextRewroteUrl', newUrl);
            (0, request_meta_1.addRequestMeta)(req, '_nextDidRewrite', newUrl !== req.url);
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
        beforeFiles = this.customRoutes.rewrites.beforeFiles.map((r) => buildRewrite(r, false));
        afterFiles = this.customRoutes.rewrites.afterFiles.map((r) => buildRewrite(r));
        fallback = this.customRoutes.rewrites.fallback.map((r) => buildRewrite(r));
      }
    }
    return {
      beforeFiles,
      afterFiles,
      fallback,
    };
  }
  getPagePath(pathname, locales) {
    return (0, require_1.getPagePath)(
      this.serverOptions.computeJs.assets,
      pathname,
      this.dir,
      this.distDir,
      this._isLikeServerless,
      this.renderOpts.dev,
      locales,
      this.nextConfig.experimental.appDir
    );
  }
  async renderPageComponent(ctx, bubbleNoFallback) {
    // node's next-server would try to run this first as an edge function.
    // TODO: do that one day =)
    return super.renderPageComponent(ctx, bubbleNoFallback);
  }
  async findPageComponents({ pathname, query, params, isAppPath }) {
    let paths = [
      // try serving a static AMP version first
      query.amp
        ? (isAppPath ? (0, app_paths_1.normalizeAppPath)(pathname) : (0, normalize_page_path_1.normalizePagePath)(pathname)) + '.amp'
        : null,
      pathname,
    ].filter(Boolean);
    if (query.__nextLocale) {
      paths = [...paths.map((path) => `/${query.__nextLocale}${path === '/' ? '' : path}`), ...paths];
    }
    for (const pagePath of paths) {
      try {
        const components = await (0, load_components_1.loadComponents)(
          this.serverOptions.computeJs.assets,
          this.distDir,
          pagePath,
          this.dir,
          !this.renderOpts.dev && this._isLikeServerless,
          !!this.renderOpts.serverComponents,
          isAppPath
        );
        if (
          query.__nextLocale &&
          typeof components.Component === 'string' &&
          !(pagePath === null || pagePath === void 0 ? void 0 : pagePath.startsWith(`/${query.__nextLocale}`))
        ) {
          // if loading a static HTML file the locale is required
          // to be present since all HTML files are output under their locale
          continue;
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
        if (!(err instanceof utils_1.PageNotFoundError)) {
          throw err;
        }
      }
    }
    return null;
  }
  getFontManifest() {
    return (0, require_1.requireFontManifest)(this.serverOptions.computeJs.assets, this.distDir, this.dir, this._isLikeServerless);
  }
  getServerComponentManifest() {
    // TODO: If we want to support Server Components
    return undefined;
  }
  getServerCSSManifest() {
    // TODO: If we want to support Server Components
    return undefined;
  }
  async getFallback(page) {
    const pagePath = (0, normalize_page_path_1.normalizePagePath)(page);
    const fullPagePath = (0, path_1.join)(this.serverDistDir, 'pages', `${pagePath}.html`);
    return (0, require_1.readAssetFileAsString)(this.serverOptions.computeJs.assets, fullPagePath, this.dir);
  }
  generateRoutes() {
    const publicRoutes = this.generatePublicRoutes();
    const imageRoutes = this.generateImageRoutes();
    const staticFilesRoutes = this.generateStaticRoutes();
    const fsRoutes = [
      ...this.generateFsStaticRoutes(),
      {
        match: (0, path_match_1.getPathMatch)('/_next/data/:path*'),
        type: 'route',
        name: '_next/data catchall',
        check: true,
        fn: async (req, res, params, _parsedUrl) => {
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
          pathname = (0, get_route_from_asset_path_1.default)(pathname, '.json');
          // ensure trailing slash is normalized per config
          if (this.router.catchAllMiddleware[0]) {
            if (this.nextConfig.trailingSlash && !pathname.endsWith('/')) {
              pathname += '/';
            }
            if (!this.nextConfig.trailingSlash && pathname.length > 1 && pathname.endsWith('/')) {
              pathname = pathname.substring(0, pathname.length - 1);
            }
          }
          if (this.nextConfig.i18n) {
            const { host } = (req === null || req === void 0 ? void 0 : req.headers) || {};
            // remove port from host and remove port if present
            const hostname = host === null || host === void 0 ? void 0 : host.split(':')[0].toLowerCase();
            const localePathResult = (0, normalize_locale_path_1.normalizeLocalePath)(pathname, this.nextConfig.i18n.locales);
            const { defaultLocale } = (0, detect_domain_locale_1.detectDomainLocale)(this.nextConfig.i18n.domains, hostname) || {};
            let detectedLocale = '';
            if (localePathResult.detectedLocale) {
              pathname = localePathResult.pathname;
              detectedLocale = localePathResult.detectedLocale;
            }
            _parsedUrl.query.__nextLocale = detectedLocale;
            _parsedUrl.query.__nextDefaultLocale = defaultLocale || this.nextConfig.i18n.defaultLocale;
            if (!detectedLocale && !this.router.catchAllMiddleware[0]) {
              _parsedUrl.query.__nextLocale = _parsedUrl.query.__nextDefaultLocale;
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
        match: (0, path_match_1.getPathMatch)('/_next/:path*'),
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
    const restrictedRedirectPaths = this.nextConfig.basePath ? [`${this.nextConfig.basePath}/_next`] : ['/_next'];
    // Headers come very first
    const headers = this.minimalMode
      ? []
      : this.customRoutes.headers.map((rule) => (0, server_route_utils_1.createHeaderRoute)({ rule, restrictedRedirectPaths }));
    const redirects = this.minimalMode
      ? []
      : this.customRoutes.redirects.map((rule) => (0, server_route_utils_1.createRedirectRoute)({ rule, restrictedRedirectPaths }));
    const rewrites = this.generateRewrites({ restrictedRedirectPaths });
    const catchAllMiddleware = this.generateCatchAllMiddlewareRoute();
    const catchAllRoute = {
      match: (0, path_match_1.getPathMatch)('/:path*'),
      type: 'route',
      matchesLocale: true,
      name: 'Catchall render',
      fn: async (req, res, _params, parsedUrl) => {
        var _a;
        let { pathname, query } = parsedUrl;
        if (!pathname) {
          throw new Error('pathname is undefined');
        }
        // next.js core assumes page path without trailing slash
        pathname = (0, remove_trailing_slash_1.removeTrailingSlash)(pathname);
        if (this.nextConfig.i18n) {
          const localePathResult = (0, normalize_locale_path_1.normalizeLocalePath)(
            pathname,
            (_a = this.nextConfig.i18n) === null || _a === void 0 ? void 0 : _a.locales
          );
          if (localePathResult.detectedLocale) {
            pathname = localePathResult.pathname;
            parsedUrl.query.__nextLocale = localePathResult.detectedLocale;
          }
        }
        const bubbleNoFallback = !!query._nextBubbleNoFallback;
        if (pathname === '/api' || pathname.startsWith('/api/')) {
          delete query._nextBubbleNoFallback;
          const handled = await this.handleApiRequest(req, res, pathname, query);
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
          if (err instanceof base_server_1.NoFallbackError && bubbleNoFallback) {
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
  async ensureApiPage(_pathname) {}
  /**
   * Resolves `API` request, in development builds on demand
   * @param req http request
   * @param res http response
   * @param pathname path of request
   */
  async handleApiRequest(req, res, pathname, query) {
    let page = pathname;
    let params = undefined;
    let pageFound = !(0, utils_3.isDynamicRoute)(page) && (await this.hasPage(page));
    if (!pageFound && this.dynamicRoutes) {
      for (const dynamicRoute of this.dynamicRoutes) {
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
      if ((0, is_error_1.default)(err) && err.code === 'ENOENT') {
        return false;
      }
      throw err;
    }
    return this.runApi(req, res, query, params, page, builtPagePath);
  }
  getCacheFilesystem() {
    return {
      readFile: (f) => {
        const content = (0, require_1.readAssetFileAsString)(this.serverOptions.computeJs.assets, f, this.dir);
        return Promise.resolve(content);
      },
      readFileSync: (f) => {
        return (0, require_1.readAssetFileAsString)(this.serverOptions.computeJs.assets, f, this.dir);
      },
      writeFile: (f, d) => {
        throw new Error('Writing to cache not currently supported');
      },
      mkdir: (dir) => {
        // writing to cache not currently supported, but silently succeed on mkdir for now
        return Promise.resolve();
      },
      stat: (f) => {
        return Promise.resolve({ mtime: NextComputeJsServer._mtime });
      },
    };
  }
  getPrerenderManifest() {
    if (this._cachedPreviewManifest) {
      return this._cachedPreviewManifest;
    }
    const manifestFile = (0, path_1.join)(this.distDir, constants_1.PRERENDER_MANIFEST);
    const manifest = (0, require_1.readAssetManifest)(this.serverOptions.computeJs.assets, manifestFile, this.dir);
    return (this._cachedPreviewManifest = manifest);
  }
  getRoutesManifest() {
    const routesManifestFile = (0, path_1.join)(this.distDir, constants_1.ROUTES_MANIFEST);
    return (0, require_1.readAssetManifest)(this.serverOptions.computeJs.assets, routesManifestFile, this.dir);
  }
  attachRequestMeta(req, parsedUrl) {
    // In C@E, the protocol is always https on prod and http on dev
    const hostname = 'localhost';
    const protocol = hostname !== 'localhost' ? 'https' : 'http';
    // When there are hostname and port we build an absolute URL
    const initUrl = this.hostname && this.port ? `${protocol}://${this.hostname}:${this.port}${req.url}` : req.url;
    (0, request_meta_1.addRequestMeta)(req, '__NEXT_INIT_URL', initUrl);
    (0, request_meta_1.addRequestMeta)(req, '__NEXT_INIT_QUERY', { ...parsedUrl.query });
    (0, request_meta_1.addRequestMeta)(req, '_protocol', protocol);
    (0, request_meta_1.addRequestMeta)(req, '__NEXT_CLONABLE_BODY', (0, body_streams_1.getClonableBody)(req.body));
  }
  get _isLikeServerless() {
    return (0, utils_2.isTargetLikeServerless)(this.nextConfig.target);
  }
  get serverDistDir() {
    return (0, path_1.join)(this.distDir, this._isLikeServerless ? constants_1.SERVERLESS_DIRECTORY : constants_1.SERVER_DIRECTORY);
  }
}
exports.default = NextComputeJsServer;
// We're going to use the time the build happened as the last modified time for the
// sake of the cache file system for now.
NextComputeJsServer._mtime = new Date();
//# sourceMappingURL=next-compute-js-server.js.map
