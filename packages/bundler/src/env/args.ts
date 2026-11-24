import { existsSync, readFileSync } from 'fs';
import { relative, resolve } from 'path';
import { feedback } from '@aziontech/utils/node';
import { BUNDLER } from '../constants';

export type EdgeArgs = Record<string, unknown>;

/**
 * Absolute path of the args file: the one given to `azbundler dev --args-path` (kept in `bundler.argsPath`), or
 * azion/args.json. A relative path is resolved against the project directory (the cwd).
 */
export function resolveArgsPath(): string {
  return resolve(process.cwd(), globalThis.bundler?.argsPath || BUNDLER.ARGS_PATH);
}

/**
 * Sets the args file to use (`azbundler dev --args-path`). It is kept relative to the project directory because the
 * FetchEvent polyfill of @aziontech/builder joins `bundler.argsPath` with the cwd.
 */
export function setArgsPath(argsPath: string): void {
  globalThis.bundler.argsPath = relative(process.cwd(), resolve(argsPath));
}

/**
 * Loads the Azion args (azion/args.json by default, the file the Azion CLI uploads with the function) for the dev sandbox,
 * so the local runtime hands the function the same `event.args` / `ctx.args` a deployed one receives.
 *
 * The CLI creates the file as `{}` when a project has none, so an absent file is the normal "no args" state and
 * resolves to `{}` silently. A file that is not valid JSON, or not a JSON object, also resolves to `{}`, with a
 * warning: it would be rejected on deploy, and the function should not crash locally because of it.
 *
 * The file is read on every call (once per request), so editing it takes effect without restarting the server.
 */
export function loadSandboxArgs(): EdgeArgs {
  const argsPath = resolveArgsPath();
  if (!existsSync(argsPath)) return {};

  try {
    const args: unknown = JSON.parse(readFileSync(argsPath, 'utf-8'));
    if (args === null || typeof args !== 'object' || Array.isArray(args)) {
      throw new Error('the content must be a JSON object');
    }
    return args as EdgeArgs;
  } catch (error) {
    feedback.server.warn(
      `Could not read ${argsPath}, using empty args: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {};
  }
}
