/* eslint-disable consistent-return */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { env, nodeless } from 'unenv';
import { builtinModules } from 'node:module';
import { getAbsoluteLibDirPath } from '#utils';
import unenvPresetAzion from 'azion/unenv-preset';

const require = createRequire(import.meta.url);

const { alias, inject, polyfill, external } = env(nodeless, unenvPresetAzion);

const INTERNAL_POLYFILL_DEV = 'internal-env-dev';
const INTERNAL_POLYFILL_PROD = 'internal-env-prod';
const INTERNAL_POLYFILL_PATH = `${getAbsoluteLibDirPath()}/env/polyfills`;
const INTERNAL_POLYFILL_PATH_PROD = `azion/unenv-preset/src/polyfills/node`;
const POLYFILL_PREFIX_DEV = 'aziondev:';
const POLYFILL_PREFIX_PROD = 'azionprd:';

/**
 * Get global inject
 * @param {*} globalInject Global inject
 * @returns {*} Return import statement and export name
 */
function getGlobalInject(globalInject) {
  if (typeof globalInject === 'string') {
    return {
      importStatement: `import globalVar from "${globalInject}";`,
      exportName: 'globalVar',
    };
  }
  const [moduleSpecifier, exportName] = globalInject;
  return {
    importStatement: `import { ${exportName} } from "${moduleSpecifier}";`,
    exportName,
  };
}

/**
 * Handle alias unenv
 * @param {*} build Build object
 */
function handleAliasUnenv(build) {
  const UNENV_ALIAS_NAMESPACE = 'imported-unenv-alias';

  const aliasAbsolute = {};
  Object.entries(alias).forEach(([module, unresolvedAlias]) => {
    try {
      aliasAbsolute[module] = require
        .resolve(unresolvedAlias)
        .replace(/\.cjs$/, '.mjs');
    } catch (e) {
      console.log(e?.message);
      // this is an alias for package that is not installed in the current app => ignore
    }
  });

  const UNENV_ALIAS_RE = new RegExp(
    `^(${Object.keys(aliasAbsolute).join('|')})$`,
  );

  build.onResolve({ filter: UNENV_ALIAS_RE }, (args) => {
    return {
      path: args.path,
      namespace: UNENV_ALIAS_NAMESPACE,
    };
  });

  build.onLoad(
    { filter: /.*/, namespace: UNENV_ALIAS_NAMESPACE },
    async (args) => {
      const filePath = aliasAbsolute[args.path];
      const contents = await fs.promises.readFile(filePath, 'utf8');
      const resolveDir = path.dirname(filePath);

      return {
        loader: 'js',
        contents,
        resolveDir,
      };
    },
  );
}

/**
 * Node built in modules
 * @param {*} build Build object
 * @param {*} isProd Is production build
 */
function nodeBuiltInModules(build, isProd) {
  const IMPORTED_NODE_BUILT_IN_NAMESPACE = 'node-built-in-modules';

  const NODEJS_MODULES_RE = new RegExp(
    `^(node:)?(${builtinModules.join('|')})$`,
  );

  build.onResolve({ filter: NODEJS_MODULES_RE }, (args) => {
    const nameModuleWithoutNode = args.path.replace('node:', '');
    const pathAlias =
      alias[nameModuleWithoutNode] ?? alias[args.path] ?? args.path;

    const findModulePolyfill = (prefix, nameModule) => {
      return polyfill.find((p) => p.startsWith(`${prefix}${nameModule}`));
    };

    const resolvePolyfill = (prefix, namespace, nameModule) => {
      const externalModule = external.find((ext) => {
        return (
          ext === nameModule ||
          ext === args.path ||
          `node:${nameModule}` === ext
        );
      });
      const polyfillResult = findModulePolyfill(prefix, nameModule);
      // if polyfill is not found, check if the module is external
      if (!polyfillResult && externalModule) {
        return {
          path: args.path,
          external: externalModule.includes(args.path),
        };
      }
      if (polyfillResult) {
        return { path: nameModule, namespace };
      }
    };

    const result = isProd
      ? resolvePolyfill(
          POLYFILL_PREFIX_PROD,
          INTERNAL_POLYFILL_PROD,
          nameModuleWithoutNode,
        )
      : resolvePolyfill(
          POLYFILL_PREFIX_DEV,
          INTERNAL_POLYFILL_DEV,
          nameModuleWithoutNode,
        );

    return (
      result ?? {
        path: pathAlias,
        namespace: IMPORTED_NODE_BUILT_IN_NAMESPACE,
        external: external.includes(args.path),
      }
    );
  });

  build.onLoad(
    { filter: /.*/, namespace: IMPORTED_NODE_BUILT_IN_NAMESPACE },
    async (args) => {
      const resolved = require.resolve(args.path);
      const contents = await fs.promises.readFile(resolved, 'utf8');
      const resolveDir = path.dirname(resolved);

      return {
        loader: 'js',
        contents,
        resolveDir,
      };
    },
  );
}

/**
 * Handle node js globals
 * @param {*} build Build object
 */
function handleNodeJSGlobals(build) {
  const UNENV_GLOBALS_RE = /_global_polyfill-([^.]+)\.js$/;
  const prefix = path.resolve(
    getAbsoluteLibDirPath(),
    '../',
    '_global_polyfill-',
  );

  // eslint-disable-next-line no-param-reassign
  build.initialOptions.inject = [
    ...(build.initialOptions.inject ?? []),
    ...Object.keys(inject).map((globalName) => `${prefix}${globalName}.js`),
  ];

  build.onResolve({ filter: UNENV_GLOBALS_RE }, (args) => ({
    path: args.path,
  }));

  build.onLoad({ filter: UNENV_GLOBALS_RE }, (args) => {
    const globalName = args.path.match(UNENV_GLOBALS_RE)[1];
    const { importStatement, exportName } = getGlobalInject(inject[globalName]);

    return {
      contents: `
				${importStatement}
				globalThis.${globalName} = ${exportName};
			`,
    };
  });
}

/**
 * Handle internal polyfill env dev
 * @param {*} build Build object
 */
function handleInternalPolyfillEnvDev(build) {
  build.onLoad(
    { filter: /.*/, namespace: INTERNAL_POLYFILL_DEV },
    async (args) => {
      try {
        const argsPathWhitoutNode = args.path.replace('node:', '');
        const polyfillPath = polyfill.find((p) =>
          p.startsWith(`${POLYFILL_PREFIX_DEV}${argsPathWhitoutNode}`),
        );
        const internalPolyfillsPath = path.join(
          INTERNAL_POLYFILL_PATH,
          polyfillPath.replace(
            `${POLYFILL_PREFIX_DEV}${argsPathWhitoutNode}:/`,
            '',
          ),
        );
        const contents = await fs.promises.readFile(
          internalPolyfillsPath,
          'utf8',
        );
        const resolveDir = path.dirname(internalPolyfillsPath);
        return {
          loader: 'js',
          contents,
          resolveDir,
        };
      } catch (error) {
        console.error(`Error loading polyfill for ${args.path}`, error);
      }
    },
  );
}

/**
 * Handle internal polyfill env prod
 * @param {*} build Build object
 */
function handleInternalPolyfillEnvProd(build) {
  build.onLoad(
    { filter: /.*/, namespace: INTERNAL_POLYFILL_PROD },
    async (args) => {
      try {
        const polyfillPath = polyfill.find((p) =>
          p.startsWith(`${POLYFILL_PREFIX_PROD}${args.path}`),
        );
        const internalPolyfillsPath = path.join(
          INTERNAL_POLYFILL_PATH_PROD,
          polyfillPath.replace(`${POLYFILL_PREFIX_PROD}${args.path}:/`, ''),
        );
        const resolved = require.resolve(internalPolyfillsPath);
        const contents = await fs.promises.readFile(resolved, 'utf8');
        const resolveDir = path.dirname(resolved);
        return {
          loader: 'js',
          contents,
          resolveDir,
        };
      } catch (error) {
        console.error(`Error loading polyfill prod for ${args.path}`, error);
      }
    },
  );
}

/**
 * Define next js runtime
 * @param {*} options Options object
 */
function defineNextJsRuntime(options) {
  if (fs.existsSync(path.join(process.cwd(), '.next'))) {
    const buildId = fs.readFileSync(
      path.join(process.cwd(), '.next/BUILD_ID'),
      'utf-8',
    );
    // eslint-disable-next-line no-param-reassign
    options.define = {
      ...options.define,
      'process.env.NEXT_RUNTIME': '"edge"',
      'process.env.NEXT_COMPUTE_JS': 'true',
      'process.env.__NEXT_BUILD_ID': `"${buildId}"`,
    };
  }
}

/**
 * ESBuild Node Module Plugin for polyfilling node modules.
 * @param {boolean} buildProd Parameter to identify whether the build is dev or prod
 * @returns {object} - ESBuild plugin object.
 */
const ESBuildNodeModulePlugin = (buildProd) => {
  const NAME = 'bundler-node-modules-polyfills';

  return {
    /**
     * Name and setup of the ESBuild plugin.
     * @param {object} build - ESBuild build object.
     */
    name: NAME,
    setup: (build) => {
      // build options
      const options = build.initialOptions;
      options.define = options.define || {};

      if (!options.define?.global) {
        options.define.global = 'globalThis';
      }

      // define env
      options.define = {
        ...options.define,
        'process.env.NODE_ENV': '"production"',
      };

      // define nextjs runtime
      defineNextJsRuntime(options);

      // build inject
      options.inject = options.inject || [];

      options.alias = {
        ...options.alias,
      };

      // resolve modules
      nodeBuiltInModules(build, buildProd);
      handleAliasUnenv(build, alias, external);
      handleNodeJSGlobals(build, inject);
      handleInternalPolyfillEnvDev(build);
      handleInternalPolyfillEnvProd(build);
    },
  };
};

export default ESBuildNodeModulePlugin;
