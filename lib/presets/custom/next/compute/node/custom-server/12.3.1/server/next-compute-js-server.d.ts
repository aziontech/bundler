/// <reference types="node" />
/// <reference types="node" />
import type { ParsedUrlQuery } from 'querystring';
import { UrlWithParsedQuery } from 'url';
import { PrerenderManifest } from 'next/dist/build';
import { PagesManifest } from 'next/dist/build/webpack/plugins/pages-manifest-plugin';
import { CustomRoutes } from 'next/dist/lib/load-custom-routes';
import { BaseNextRequest, BaseNextResponse } from 'next/dist/server/base-http';
import BaseServer, { FindComponentsResult, RequestContext } from 'next/dist/server/base-server';
import { FontManifest } from 'next/dist/server/font-utils';
import { NextParsedUrlQuery, NextUrlWithParsedQuery } from 'next/dist/server/request-meta';
import { RenderOpts } from 'next/dist/server/render';
import RenderResult from 'next/dist/server/render-result';
import { DynamicRoutes, PageChecker, Route } from 'next/dist/server/router';
import { PayloadOptions } from 'next/dist/server/send-payload';
import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';
import { ParsedUrl } from 'next/dist/shared/lib/router/utils/parse-url';
import { CacheFs } from 'next/dist/shared/lib/utils';
import { ComputeJsNextRequest, ComputeJsNextResponse } from './server/base-http/compute-js';
import { ComputeJsServerOptions } from './common';
import ResponseCache from "next/dist/server/response-cache";
import { NextConfig } from "next";
/**
 * An implementation of a Next.js server that has been adapted to run in Compute@Edge.
 * (An adaptation for Compute@Edge of NextNodeServer in Next.js,
 * found at next/server/next-server.ts)
 */
export default class NextComputeJsServer extends BaseServer<ComputeJsServerOptions> {
    constructor(options: ComputeJsServerOptions);
    private compression;
    protected loadEnvConfig(params: {
        dev: boolean;
    }): void;
    protected getResponseCache({ dev }: {
        dev: boolean;
    }): ResponseCache;
    protected getPublicDir(): string;
    protected getHasStaticDir(): boolean;
    protected getPagesManifest(): PagesManifest | undefined;
    protected getAppPathsManifest(): PagesManifest | undefined;
    protected hasPage(pathname: string): Promise<boolean>;
    protected getBuildId(): string;
    protected getCustomRoutes(): CustomRoutes;
    protected generateImageRoutes(): Route[];
    protected generateStaticRoutes(): Route[];
    protected setImmutableAssetCacheControl(res: BaseNextResponse): void;
    protected generateFsStaticRoutes(): Route[];
    protected generatePublicRoutes(): Route[];
    private _validFilesystemPathSet;
    protected getFilesystemPaths(): Set<string>;
    protected sendRenderResult(req: ComputeJsNextRequest, res: ComputeJsNextResponse, options: {
        result: RenderResult;
        type: "html" | "json";
        generateEtags: boolean;
        poweredByHeader: boolean;
        options?: PayloadOptions;
    }): Promise<void>;
    protected sendStatic(req: ComputeJsNextRequest, res: ComputeJsNextResponse, path: string): Promise<void>;
    protected handleCompression(req: ComputeJsNextRequest, res: ComputeJsNextResponse): void;
    protected handleUpgrade(req: ComputeJsNextRequest, socket: any, head: any): Promise<void>;
    protected proxyRequest(req: ComputeJsNextRequest, res: ComputeJsNextResponse, parsedUrl: ParsedUrl, upgradeHead?: any): Promise<{
        finished: boolean;
    }>;
    protected runApi(req: BaseNextRequest | ComputeJsNextRequest, res: BaseNextResponse | ComputeJsNextResponse, query: ParsedUrlQuery, params: Params | undefined, page: string, builtPagePath: string): Promise<boolean>;
    protected renderHTML(req: ComputeJsNextRequest, res: ComputeJsNextResponse, pathname: string, query: NextParsedUrlQuery, renderOpts: RenderOpts): Promise<RenderResult | null>;
    serveStatic(req: BaseNextRequest, res: BaseNextResponse, path: string, parsedUrl?: UrlWithParsedQuery): Promise<void>;
    protected isServeableUrl(untrustedFileUrl: string): boolean;
    protected generateCatchAllMiddlewareRoute(): Route[];
    protected generateRewrites({ restrictedRedirectPaths, }: {
        restrictedRedirectPaths: string[];
    }): {
        beforeFiles: Route[];
        afterFiles: Route[];
        fallback: Route[];
    };
    protected getPagePath(pathname: string, locales?: string[]): string;
    protected renderPageComponent(ctx: RequestContext, bubbleNoFallback: boolean): Promise<false | {
        type: "html" | "json";
        body: RenderResult;
        revalidateOptions?: any;
    } | null>;
    protected findPageComponents({ pathname, query, params, isAppPath, }: {
        pathname: string;
        query: NextParsedUrlQuery;
        params: Params | null;
        isAppPath: boolean;
    }): Promise<FindComponentsResult | null>;
    protected getFontManifest(): FontManifest | undefined;
    protected getServerComponentManifest(): any;
    protected getServerCSSManifest(): undefined;
    protected getFallback(page: string): Promise<any>;
    protected generateRoutes(): {
        headers: Route[];
        rewrites: {
            beforeFiles: Route[];
            afterFiles: Route[];
            fallback: Route[];
        };
        fsRoutes: Route[];
        redirects: Route[];
        catchAllRoute: Route;
        catchAllMiddleware: Route[];
        pageChecker: PageChecker;
        useFileSystemPublicRoutes: boolean;
        dynamicRoutes: DynamicRoutes | undefined;
        nextConfig: NextConfig;
    };
    protected ensureApiPage(_pathname: string): Promise<void>;
    /**
     * Resolves `API` request, in development builds on demand
     * @param req http request
     * @param res http response
     * @param pathname path of request
     */
    protected handleApiRequest(req: BaseNextRequest, res: BaseNextResponse, pathname: string, query: ParsedUrlQuery): Promise<boolean>;
    private static _mtime;
    protected getCacheFilesystem(): CacheFs;
    private _cachedPreviewManifest;
    protected getPrerenderManifest(): PrerenderManifest;
    protected getRoutesManifest(): CustomRoutes;
    protected attachRequestMeta(req: BaseNextRequest, parsedUrl: NextUrlWithParsedQuery): void;
    protected get _isLikeServerless(): boolean;
    protected get serverDistDir(): string;
}
//# sourceMappingURL=next-compute-js-server.d.ts.map