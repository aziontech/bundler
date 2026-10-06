import {
  DEFAULT_API_VERSION,
  SUPPORTED_API_VERSIONS,
  isSupportedApiVersion,
  type ApiVersion,
} from '@aziontech/config';

const supported = () => SUPPORTED_API_VERSIONS.join(', ');

/**
 * Parses the value of --config-version. Accepts `3`, `"3"` and `"v3"`.
 * @throws {Error} When the value is not a supported config version.
 */
export const parseConfigVersion = (value: unknown): ApiVersion | undefined => {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = typeof value === 'string' ? Number(value.trim().replace(/^v/i, '')) : value;
  if (!isSupportedApiVersion(parsed)) {
    throw new Error(
      `Invalid config version "${String(value)}". Supported versions: ${supported()}.`,
    );
  }
  return parsed;
};

/**
 * Resolves which config (Azion API) version a project targets:
 * `--config-version` flag > `version` in azion.config > default version.
 *
 * @throws {Error} When the flag and the azion.config declare different versions, or when the version is not supported.
 */
export const resolveConfigVersion = ({
  flag,
  config,
}: {
  flag?: unknown;
  config?: { version?: unknown } | null;
}): ApiVersion => {
  const fromFlag = parseConfigVersion(flag);

  const declared = config?.version;
  const fromFile =
    declared === undefined || declared === null ? undefined : parseConfigVersion(declared);

  if (fromFlag !== undefined && fromFile !== undefined && fromFlag !== fromFile) {
    throw new Error(
      `Conflicting config versions: --config-version is ${fromFlag} but azion.config declares version ${fromFile}. ` +
        'Remove the flag or update the "version" field of your azion.config.',
    );
  }

  return fromFlag ?? fromFile ?? DEFAULT_API_VERSION;
};
