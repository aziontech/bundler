import fs from 'fs';
import fsPromises from 'fs/promises';
import { join } from 'path';

export interface EnvFileEntry {
  key: string;
  value: string;
}

/**
 * Parses KEY=VALUE lines from a .env file's content, skipping comments and blank lines.
 * Values are returned raw (no quote stripping or expansion) — this keeps generated files
 * (.edge/.env, .edge/.env.azion) byte-faithful to what the user wrote. Callers that inject a
 * value into a live JS context should unwrap quotes themselves; see `unwrapEnvValue`.
 */
export const parseEnvFileEntries = (content: string): EnvFileEntry[] =>
  content
    .split('\n')
    .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({ key: match[1], value: match[2] }));

/**
 * Strips a single matching pair of surrounding quotes (single or double), like standard .env
 * parsers do, e.g. `"http://localhost:3333"` -> `http://localhost:3333`. Also trims trailing
 * `\r` from CRLF line endings. Unquoted values are just trimmed.
 */
export const unwrapEnvValue = (rawValue: string): string => {
  const trimmed = rawValue.trim().replace(/\r$/, '');
  const isQuoted =
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")));
  return isQuoted ? trimmed.slice(1, -1) : trimmed;
};

/**
 * .env file precedence, highest priority first — same convention as Next.js:
 * https://nextjs.org/docs/pages/guides/environment-variables#environment-variable-load-order
 */
const envFilePrecedence = (production: boolean): string[] =>
  production
    ? ['.env.production.local', '.env.local', '.env.production', '.env']
    : ['.env.development.local', '.env.local', '.env.development', '.env'];

/**
 * Merges the project's .env* files into a single set of entries, following the precedence order
 * above. Files earlier in the precedence list win on key conflicts.
 */
export async function resolveMergedEnvEntries(
  cwd: string,
  production: boolean,
): Promise<EnvFileEntry[]> {
  const merged = new Map<string, string>();

  for (const fileName of [...envFilePrecedence(production)].reverse()) {
    const filePath = join(cwd, fileName);
    const exists = await fsPromises
      .access(filePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    if (!exists) continue;

    const content = await fsPromises.readFile(filePath, 'utf-8');
    parseEnvFileEntries(content).forEach(({ key, value }) => merged.set(key, value));
  }

  return Array.from(merged, ([key, value]) => ({ key, value }));
}
