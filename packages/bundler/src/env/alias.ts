/**
 * Temporary workaround for Azion's global (non-project-scoped) environment variables.
 * See ENV_ALIAS in constants.ts. Remove once Azion supports project-scoped environment variables.
 */
import { ENV_ALIAS } from '../constants';

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
