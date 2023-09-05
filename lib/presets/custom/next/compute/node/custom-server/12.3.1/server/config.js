"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc., licensed under the MIT license. See LICENSE file for details.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = void 0;
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const constants_1 = require("next/constants");
const Log = __importStar(require("next/dist/build/output/log"));
const config_shared_1 = require("next/dist/server/config-shared");
const utils_1 = require("next/dist/shared/lib/utils");
const image_config_1 = require("next/dist/shared/lib/image-config");
const targets = ['server' /*, 'serverless', 'experimental-serverless-trace'*/];
/* ------ */
/* These functions copied from Next.js: next/server/config.ts, because they are not exported from that file. */
const experimentalWarning = (0, utils_1.execOnce)((configFileName, features) => {
    const s = features.length > 1 ? 's' : '';
    Log.warn(chalk_1.default.bold(`You have enabled experimental feature${s} (${features.join(', ')}) in ${configFileName}.`));
    Log.warn(`Experimental features are not covered by semver, and may cause unexpected or broken application behavior. ` +
        `Use at your own risk.`);
    console.warn();
});
function assignDefaults(userConfig) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const configFileName = userConfig.configFileName;
    if (typeof userConfig.exportTrailingSlash !== 'undefined') {
        console.warn(chalk_1.default.yellow.bold('Warning: ') +
            `The "exportTrailingSlash" option has been renamed to "trailingSlash". Please update your ${configFileName}.`);
        if (typeof userConfig.trailingSlash === 'undefined') {
            userConfig.trailingSlash = userConfig.exportTrailingSlash;
        }
        delete userConfig.exportTrailingSlash;
    }
    const config = Object.keys(userConfig).reduce((currentConfig, key) => {
        const value = userConfig[key];
        if (value === undefined || value === null) {
            return currentConfig;
        }
        if (key === 'experimental' && typeof value === 'object') {
            const enabledExperiments = [];
            // defaultConfig.experimental is predefined and will never be undefined
            // This is only a type guard for the typescript
            if (config_shared_1.defaultConfig.experimental) {
                for (const featureName of Object.keys(value)) {
                    if (value[featureName] !== config_shared_1.defaultConfig.experimental[featureName]) {
                        enabledExperiments.push(featureName);
                    }
                }
            }
            if (enabledExperiments.length > 0) {
                experimentalWarning(configFileName, enabledExperiments);
            }
        }
        if (key === 'distDir') {
            if (typeof value !== 'string') {
                throw new Error(`Specified distDir is not a string, found type "${typeof value}"`);
            }
            const userDistDir = value.trim();
            // don't allow public as the distDir as this is a reserved folder for
            // public files
            if (userDistDir === 'public') {
                throw new Error(`The 'public' directory is reserved in Next.js and can not be set as the 'distDir'. https://nextjs.org/docs/messages/can-not-output-to-public`);
            }
            // make sure distDir isn't an empty string as it can result in the provided
            // directory being deleted in development mode
            if (userDistDir.length === 0) {
                throw new Error(`Invalid distDir provided, distDir can not be an empty string. Please remove this config or set it to undefined`);
            }
        }
        if (key === 'pageExtensions') {
            if (!Array.isArray(value)) {
                throw new Error(`Specified pageExtensions is not an array of strings, found "${value}". Please update this config or remove it.`);
            }
            if (!value.length) {
                throw new Error(`Specified pageExtensions is an empty array. Please update it with the relevant extensions or remove it.`);
            }
            value.forEach((ext) => {
                if (typeof ext !== 'string') {
                    throw new Error(`Specified pageExtensions is not an array of strings, found "${ext}" of type "${typeof ext}". Please update this config or remove it.`);
                }
            });
        }
        if (!!value && value.constructor === Object) {
            currentConfig[key] = {
                ...config_shared_1.defaultConfig[key],
                ...Object.keys(value).reduce((c, k) => {
                    const v = value[k];
                    if (v !== undefined && v !== null) {
                        c[k] = v;
                    }
                    return c;
                }, {}),
            };
        }
        else {
            currentConfig[key] = value;
        }
        return currentConfig;
    }, {});
    const result = { ...config_shared_1.defaultConfig, ...config };
    if (typeof result.assetPrefix !== 'string') {
        throw new Error(`Specified assetPrefix is not a string, found type "${typeof result.assetPrefix}" https://nextjs.org/docs/messages/invalid-assetprefix`);
    }
    if (typeof result.basePath !== 'string') {
        throw new Error(`Specified basePath is not a string, found type "${typeof result.basePath}"`);
    }
    if (result.basePath !== '') {
        if (result.basePath === '/') {
            throw new Error(`Specified basePath /. basePath has to be either an empty string or a path prefix"`);
        }
        if (!result.basePath.startsWith('/')) {
            throw new Error(`Specified basePath has to start with a /, found "${result.basePath}"`);
        }
        if (result.basePath !== '/') {
            if (result.basePath.endsWith('/')) {
                throw new Error(`Specified basePath should not end with /, found "${result.basePath}"`);
            }
            if (result.assetPrefix === '') {
                result.assetPrefix = result.basePath;
            }
            if (((_a = result.amp) === null || _a === void 0 ? void 0 : _a.canonicalBase) === '') {
                result.amp.canonicalBase = result.basePath;
            }
        }
    }
    if (result === null || result === void 0 ? void 0 : result.images) {
        const images = result.images;
        if (typeof images !== 'object') {
            throw new Error(`Specified images should be an object received ${typeof images}.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
        }
        if (images.domains) {
            if (!Array.isArray(images.domains)) {
                throw new Error(`Specified images.domains should be an Array received ${typeof images.domains}.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            // static images are automatically prefixed with assetPrefix
            // so we need to ensure _next/image allows downloading from
            // this resource
            if ((_b = config.assetPrefix) === null || _b === void 0 ? void 0 : _b.startsWith('http')) {
                images.domains.push(new URL(config.assetPrefix).hostname);
            }
            if (images.domains.length > 50) {
                throw new Error(`Specified images.domains exceeds length of 50, received length (${images.domains.length}), please reduce the length of the array to continue.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            const invalid = images.domains.filter((d) => typeof d !== 'string');
            if (invalid.length > 0) {
                throw new Error(`Specified images.domains should be an Array of strings received invalid values (${invalid.join(', ')}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
        }
        const remotePatterns = (_c = result === null || result === void 0 ? void 0 : result.images) === null || _c === void 0 ? void 0 : _c.remotePatterns;
        if (remotePatterns) {
            if (!Array.isArray(remotePatterns)) {
                throw new Error(`Specified images.remotePatterns should be an Array received ${typeof remotePatterns}.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            if (remotePatterns.length > 50) {
                throw new Error(`Specified images.remotePatterns exceeds length of 50, received length (${remotePatterns.length}), please reduce the length of the array to continue.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            const validProps = new Set(['protocol', 'hostname', 'pathname', 'port']);
            const requiredProps = ['hostname'];
            const invalidPatterns = remotePatterns.filter((d) => !d ||
                typeof d !== 'object' ||
                Object.entries(d).some(([k, v]) => !validProps.has(k) || typeof v !== 'string') ||
                requiredProps.some((k) => !(k in d)));
            if (invalidPatterns.length > 0) {
                throw new Error(`Invalid images.remotePatterns values:\n${invalidPatterns
                    .map((item) => JSON.stringify(item))
                    .join('\n')}\n\nremotePatterns value must follow format { protocol: 'https', hostname: 'example.com', port: '', pathname: '/imgs/**' }.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
        }
        if (images.deviceSizes) {
            const { deviceSizes } = images;
            if (!Array.isArray(deviceSizes)) {
                throw new Error(`Specified images.deviceSizes should be an Array received ${typeof deviceSizes}.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            if (deviceSizes.length > 25) {
                throw new Error(`Specified images.deviceSizes exceeds length of 25, received length (${deviceSizes.length}), please reduce the length of the array to continue.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            const invalid = deviceSizes.filter((d) => {
                return typeof d !== 'number' || d < 1 || d > 10000;
            });
            if (invalid.length > 0) {
                throw new Error(`Specified images.deviceSizes should be an Array of numbers that are between 1 and 10000, received invalid values (${invalid.join(', ')}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
        }
        if (images.imageSizes) {
            const { imageSizes } = images;
            if (!Array.isArray(imageSizes)) {
                throw new Error(`Specified images.imageSizes should be an Array received ${typeof imageSizes}.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            if (imageSizes.length > 25) {
                throw new Error(`Specified images.imageSizes exceeds length of 25, received length (${imageSizes.length}), please reduce the length of the array to continue.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            const invalid = imageSizes.filter((d) => {
                return typeof d !== 'number' || d < 1 || d > 10000;
            });
            if (invalid.length > 0) {
                throw new Error(`Specified images.imageSizes should be an Array of numbers that are between 1 and 10000, received invalid values (${invalid.join(', ')}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
        }
        if (!images.loader) {
            images.loader = 'default';
        }
        if (!image_config_1.VALID_LOADERS.includes(images.loader)) {
            throw new Error(`Specified images.loader should be one of (${image_config_1.VALID_LOADERS.join(', ')}), received invalid value (${images.loader}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
        }
        if (images.loader !== 'default' &&
            images.loader !== 'custom' &&
            images.path === image_config_1.imageConfigDefault.path) {
            throw new Error(`Specified images.loader property (${images.loader}) also requires images.path property to be assigned to a URL prefix.\nSee more info here: https://nextjs.org/docs/api-reference/next/image#loader-configuration`);
        }
        // Append trailing slash for non-default loaders and when trailingSlash is set
        if (images.path) {
            if ((images.loader !== 'default' &&
                images.path[images.path.length - 1] !== '/') ||
                result.trailingSlash) {
                images.path += '/';
            }
        }
        if (images.path === image_config_1.imageConfigDefault.path && result.basePath) {
            images.path = `${result.basePath}${images.path}`;
        }
        if (images.minimumCacheTTL &&
            (!Number.isInteger(images.minimumCacheTTL) || images.minimumCacheTTL < 0)) {
            throw new Error(`Specified images.minimumCacheTTL should be an integer 0 or more received (${images.minimumCacheTTL}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
        }
        if (images.formats) {
            const { formats } = images;
            if (!Array.isArray(formats)) {
                throw new Error(`Specified images.formats should be an Array received ${typeof formats}.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            if (formats.length < 1 || formats.length > 2) {
                throw new Error(`Specified images.formats must be length 1 or 2, received length (${formats.length}), please reduce the length of the array to continue.\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
            const invalid = formats.filter((f) => {
                return f !== 'image/avif' && f !== 'image/webp';
            });
            if (invalid.length > 0) {
                throw new Error(`Specified images.formats should be an Array of mime type strings, received invalid values (${invalid.join(', ')}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
            }
        }
        if (typeof images.dangerouslyAllowSVG !== 'undefined' &&
            typeof images.dangerouslyAllowSVG !== 'boolean') {
            throw new Error(`Specified images.dangerouslyAllowSVG should be a boolean received (${images.dangerouslyAllowSVG}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
        }
        if (typeof images.contentSecurityPolicy !== 'undefined' &&
            typeof images.contentSecurityPolicy !== 'string') {
            throw new Error(`Specified images.contentSecurityPolicy should be a string received (${images.contentSecurityPolicy}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
        }
        const unoptimized = (_d = result === null || result === void 0 ? void 0 : result.images) === null || _d === void 0 ? void 0 : _d.unoptimized;
        if (typeof unoptimized !== 'undefined' &&
            typeof unoptimized !== 'boolean') {
            throw new Error(`Specified images.unoptimized should be a boolean, received (${unoptimized}).\nSee more info here: https://nextjs.org/docs/messages/invalid-images-config`);
        }
    }
    if (result.webpack5 === false) {
        throw new Error(`Webpack 4 is no longer supported in Next.js. Please upgrade to webpack 5 by removing "webpack5: false" from ${configFileName}. https://nextjs.org/docs/messages/webpack5`);
    }
    if (result.experimental && 'swcMinify' in result.experimental) {
        Log.warn(`\`swcMinify\` has been moved out of \`experimental\`. Please update your ${configFileName} file accordingly.`);
        result.swcMinify = result.experimental.swcMinify;
    }
    if (result.experimental && 'relay' in result.experimental) {
        Log.warn(`\`relay\` has been moved out of \`experimental\` and into \`compiler\`. Please update your ${configFileName} file accordingly.`);
        result.compiler = result.compiler || {};
        result.compiler.relay = result.experimental.relay;
    }
    if (result.experimental &&
        'styledComponents' in result.experimental) {
        Log.warn(`\`styledComponents\` has been moved out of \`experimental\` and into \`compiler\`. Please update your ${configFileName} file accordingly.`);
        result.compiler = result.compiler || {};
        result.compiler.styledComponents = result.experimental.styledComponents;
    }
    if (result.experimental && 'emotion' in result.experimental) {
        Log.warn(`\`emotion\` has been moved out of \`experimental\` and into \`compiler\`. Please update your ${configFileName} file accordingly.`);
        result.compiler = result.compiler || {};
        result.compiler.emotion = result.experimental.emotion;
    }
    if (result.experimental &&
        'reactRemoveProperties' in result.experimental) {
        Log.warn(`\`reactRemoveProperties\` has been moved out of \`experimental\` and into \`compiler\`. Please update your ${configFileName} file accordingly.`);
        result.compiler = result.compiler || {};
        result.compiler.reactRemoveProperties = result.experimental.reactRemoveProperties;
    }
    if (result.experimental && 'removeConsole' in result.experimental) {
        Log.warn(`\`removeConsole\` has been moved out of \`experimental\` and into \`compiler\`. Please update your ${configFileName} file accordingly.`);
        result.compiler = result.compiler || {};
        result.compiler.removeConsole = result.experimental.removeConsole;
    }
    if ((_e = result.experimental) === null || _e === void 0 ? void 0 : _e.swcMinifyDebugOptions) {
        Log.warn('SWC minify debug option specified. This option is for debugging minifier issues and will be removed once SWC minifier is stable.');
    }
    if (result.experimental.outputStandalone) {
        Log.warn(`experimental.outputStandalone has been renamed to "output: 'standalone'", please move the config.`);
        result.output = 'standalone';
    }
    if (((_f = result.experimental) === null || _f === void 0 ? void 0 : _f.outputFileTracingRoot) &&
        !(0, path_1.isAbsolute)(result.experimental.outputFileTracingRoot)) {
        result.experimental.outputFileTracingRoot = (0, path_1.resolve)(result.experimental.outputFileTracingRoot);
        Log.warn(`experimental.outputFileTracingRoot should be absolute, using: ${result.experimental.outputFileTracingRoot}`);
    }
    if (result.output === 'standalone' && !result.outputFileTracing) {
        Log.warn(`"output: 'standalone'" requires outputFileTracing not be disabled please enable it to leverage the standalone build`);
        result.output = undefined;
    }
    if (result.i18n) {
        const { i18n } = result;
        const i18nType = typeof i18n;
        if (i18nType !== 'object') {
            throw new Error(`Specified i18n should be an object received ${i18nType}.\nSee more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
        }
        if (!Array.isArray(i18n.locales)) {
            throw new Error(`Specified i18n.locales should be an Array received ${typeof i18n.locales}.\nSee more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
        }
        if (i18n.locales.length > 100) {
            Log.warn(`Received ${i18n.locales.length} i18n.locales items which exceeds the recommended max of 100.\nSee more info here: https://nextjs.org/docs/advanced-features/i18n-routing#how-does-this-work-with-static-generation`);
        }
        const defaultLocaleType = typeof i18n.defaultLocale;
        if (!i18n.defaultLocale || defaultLocaleType !== 'string') {
            throw new Error(`Specified i18n.defaultLocale should be a string.\nSee more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
        }
        if (typeof i18n.domains !== 'undefined' && !Array.isArray(i18n.domains)) {
            throw new Error(`Specified i18n.domains must be an array of domain objects e.g. [ { domain: 'example.fr', defaultLocale: 'fr', locales: ['fr'] } ] received ${typeof i18n.domains}.\nSee more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
        }
        if (i18n.domains) {
            const invalidDomainItems = i18n.domains.filter((item) => {
                var _a;
                if (!item || typeof item !== 'object')
                    return true;
                if (!item.defaultLocale)
                    return true;
                if (!item.domain || typeof item.domain !== 'string')
                    return true;
                const defaultLocaleDuplicate = (_a = i18n.domains) === null || _a === void 0 ? void 0 : _a.find((altItem) => altItem.defaultLocale === item.defaultLocale &&
                    altItem.domain !== item.domain);
                if (defaultLocaleDuplicate) {
                    console.warn(`Both ${item.domain} and ${defaultLocaleDuplicate.domain} configured the defaultLocale ${item.defaultLocale} but only one can. Change one item's default locale to continue`);
                    return true;
                }
                let hasInvalidLocale = false;
                if (Array.isArray(item.locales)) {
                    for (const locale of item.locales) {
                        if (typeof locale !== 'string')
                            hasInvalidLocale = true;
                        for (const domainItem of i18n.domains || []) {
                            if (domainItem === item)
                                continue;
                            if (domainItem.locales && domainItem.locales.includes(locale)) {
                                console.warn(`Both ${item.domain} and ${domainItem.domain} configured the locale (${locale}) but only one can. Remove it from one i18n.domains config to continue`);
                                hasInvalidLocale = true;
                                break;
                            }
                        }
                    }
                }
                return hasInvalidLocale;
            });
            if (invalidDomainItems.length > 0) {
                throw new Error(`Invalid i18n.domains values:\n${invalidDomainItems
                    .map((item) => JSON.stringify(item))
                    .join('\n')}\n\ndomains value must follow format { domain: 'example.fr', defaultLocale: 'fr', locales: ['fr'] }.\nSee more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
            }
        }
        if (!Array.isArray(i18n.locales)) {
            throw new Error(`Specified i18n.locales must be an array of locale strings e.g. ["en-US", "nl-NL"] received ${typeof i18n.locales}.\nSee more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
        }
        const invalidLocales = i18n.locales.filter((locale) => typeof locale !== 'string');
        if (invalidLocales.length > 0) {
            throw new Error(`Specified i18n.locales contains invalid values (${invalidLocales
                .map(String)
                .join(', ')}), locales must be valid locale tags provided as strings e.g. "en-US".\n` +
                `See here for list of valid language sub-tags: http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry`);
        }
        if (!i18n.locales.includes(i18n.defaultLocale)) {
            throw new Error(`Specified i18n.defaultLocale should be included in i18n.locales.\nSee more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
        }
        const normalizedLocales = new Set();
        const duplicateLocales = new Set();
        i18n.locales.forEach((locale) => {
            const localeLower = locale.toLowerCase();
            if (normalizedLocales.has(localeLower)) {
                duplicateLocales.add(locale);
            }
            normalizedLocales.add(localeLower);
        });
        if (duplicateLocales.size > 0) {
            throw new Error(`Specified i18n.locales contains the following duplicate locales:\n` +
                `${[...duplicateLocales].join(', ')}\n` +
                `Each locale should be listed only once.\n` +
                `See more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
        }
        // make sure default Locale is at the front
        i18n.locales = [
            i18n.defaultLocale,
            ...i18n.locales.filter((locale) => locale !== i18n.defaultLocale),
        ];
        const localeDetectionType = typeof i18n.localeDetection;
        if (localeDetectionType !== 'boolean' &&
            localeDetectionType !== 'undefined') {
            throw new Error(`Specified i18n.localeDetection should be undefined or a boolean received ${localeDetectionType}.\nSee more info here: https://nextjs.org/docs/messages/invalid-i18n-config`);
        }
    }
    if ((_g = result.experimental) === null || _g === void 0 ? void 0 : _g.serverComponents) {
        const pageExtensions = [];
        (result.pageExtensions || []).forEach((ext) => {
            pageExtensions.push(ext);
            pageExtensions.push(`server.${ext}`);
            pageExtensions.push(`client.${ext}`);
        });
        result.pageExtensions = pageExtensions;
    }
    if ((_h = result.devIndicators) === null || _h === void 0 ? void 0 : _h.buildActivityPosition) {
        const { buildActivityPosition } = result.devIndicators;
        const allowedValues = [
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
        ];
        if (!allowedValues.includes(buildActivityPosition)) {
            throw new Error(`Invalid "devIndicator.buildActivityPosition" provided, expected one of ${allowedValues.join(', ')}, received ${buildActivityPosition}`);
        }
    }
    return result;
}
/* ------ */
/**
 * Loads the appropriate NextConfig for the specified phase.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/config.ts)
 */
async function loadConfig(phase, assets, dir, customConfig) {
    // no .env in Compute@Edge
    // no webpack hooks in Compute@Edge
    var _a;
    let configFileName = 'next.config.js';
    if (customConfig) {
        return assignDefaults({
            configOrigin: 'server',
            configFileName,
            ...customConfig,
        });
    }
    let path = null;
    for (const configFile of constants_1.CONFIG_FILES) {
        if ('/' + configFile in assets) {
            path = configFile;
            break;
        }
    }
    if (path === null || path === void 0 ? void 0 : path.length) {
        configFileName = (0, path_1.basename)(path);
        let userConfigModule;
        try {
            userConfigModule = assets['/' + path].module;
        }
        catch (err) {
            Log.error(`Failed to load ${configFileName}, see more info here https://nextjs.org/docs/messages/next-config-error`);
            throw err;
        }
        const userConfig = await (0, config_shared_1.normalizeConfig)(phase, userConfigModule.default || userConfigModule);
        const validateResult = (0, config_shared_1.validateConfig)(userConfig);
        if (validateResult.errors) {
            Log.warn(`Invalid next.config.js options detected: `);
            // Only load @segment/ajv-human-errors when invalid config is detected
            const { AggregateAjvError } = require('next/dist/compiled/@segment/ajv-human-errors');
            const aggregatedAjvErrors = new AggregateAjvError(validateResult.errors, {
                fieldLabels: 'js',
            });
            for (const error of aggregatedAjvErrors) {
                console.error(`  - ${error.message}`);
            }
            console.error('\nSee more info here: https://nextjs.org/docs/messages/invalid-next-config');
        }
        if (Object.keys(userConfig).length === 0) {
            Log.warn(`Detected ${configFileName}, no exported configuration found. https://nextjs.org/docs/messages/empty-configuration`);
        }
        if (userConfig.target && !targets.includes(userConfig.target)) {
            throw new Error(`Specified target is invalid. Provided: "${userConfig.target}" should be one of ${targets.join(', ')}`);
        }
        if (userConfig.target && userConfig.target !== 'server') {
            Log.warn('The `target` config is deprecated and will be removed in a future version.\n' +
                'See more info here https://nextjs.org/docs/messages/deprecated-target-config');
        }
        if ((_a = userConfig.amp) === null || _a === void 0 ? void 0 : _a.canonicalBase) {
            const { canonicalBase } = userConfig.amp || {};
            userConfig.amp = userConfig.amp || {};
            userConfig.amp.canonicalBase =
                (canonicalBase.endsWith('/')
                    ? canonicalBase.slice(0, -1)
                    : canonicalBase) || '';
        }
        if (process.env.NEXT_PRIVATE_TARGET) {
            userConfig.target = process.env.NEXT_PRIVATE_TARGET;
        }
        return assignDefaults({
            configOrigin: (0, path_1.relative)(dir, path),
            configFile: path,
            configFileName,
            ...userConfig,
        });
    }
    else {
        const configBaseName = (0, path_1.basename)(constants_1.CONFIG_FILES[0], (0, path_1.extname)(constants_1.CONFIG_FILES[0]));
        const checkFiles = [
            `${configBaseName}.jsx`,
            `${configBaseName}.ts`,
            `${configBaseName}.tsx`,
            `${configBaseName}.json`,
        ];
        let nonJsPath = null;
        for (const file of checkFiles) {
            if ('/' + file in assets) {
                nonJsPath = file;
                break;
            }
        }
        if (nonJsPath === null || nonJsPath === void 0 ? void 0 : nonJsPath.length) {
            throw new Error(`Configuring Next.js via '${(0, path_1.basename)(nonJsPath)}' is not supported. Please replace the file with 'next.config.js' or 'next.config.mjs'.`);
        }
    }
    // always call assignDefaults to ensure settings like
    // reactRoot can be updated correctly even with no next.config.js
    const completeConfig = assignDefaults(config_shared_1.defaultConfig);
    completeConfig.configFileName = configFileName;
    return completeConfig;
}
exports.loadConfig = loadConfig;
//# sourceMappingURL=config.js.map