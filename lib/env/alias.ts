/**
 * Temporary workaround for Azion's global (non-project-scoped) environment variables.
 * See ENV_ALIAS in constants.ts. Remove once Azion supports project-scoped environment variables.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { ENV_ALIAS } from '#constants';

/**
 * Resolves the project's application name to derive the env alias prefix from. This API version
 * has no `applications`/`edgeApplications` config, so the name comes from the user's project
 * instead: `azion/azion.json`'s `name` field when that file exists, otherwise `package.json`'s
 * `name`. Malformed JSON is ignored (falls through to the next source, or undefined).
 */
export const resolveApplicationName = (cwd: string): string | undefined => {
  const azionJsonPath = join(cwd, 'azion', 'azion.json');
  if (existsSync(azionJsonPath)) {
    try {
      const azionJson = JSON.parse(readFileSync(azionJsonPath, 'utf-8'));
      if (typeof azionJson?.name === 'string' && azionJson.name) return azionJson.name;
    } catch {
      // malformed azion.json, fall through to package.json
    }
  }

  const packageJsonPath = join(cwd, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (typeof packageJson?.name === 'string' && packageJson.name) return packageJson.name;
    } catch {
      // malformed package.json
    }
  }

  return undefined;
};

/**
 * Turns an application name into a safe env var prefix, e.g. "My Cool App" -> "MY_COOL_APP_".
 * Returns '' if the name has no alphanumeric characters to build a prefix from.
 */
export const sanitizeEnvPrefix = (name: string): string => {
  const core = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return core ? `${core}_` : '';
};

/**
 * Resolves the env alias prefix. Opt-in: returns '' unless AZ_BUNDLER_ENV_ALIAS_ENABLED is set
 * (set by the `--alias-env` build flag). When enabled, the prefix comes from
 * AZ_BUNDLER_ENV_ALIAS_PREFIX (explicit override), otherwise derived from the application name.
 */
export const resolveEnvAliasPrefix = (applicationName?: string): string => {
  if (process.env[ENV_ALIAS.ENABLE_VAR] !== 'true') return '';
  return process.env[ENV_ALIAS.ENV_PREFIX_VAR] || sanitizeEnvPrefix(applicationName || '');
};
