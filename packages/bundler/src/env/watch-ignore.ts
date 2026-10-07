import path from 'path';

/**
 * Directories of the project root the dev watcher does not watch: version control and IDE folders, and what the
 * bundler itself writes (a change in them must not trigger a rebuild).
 */
const IGNORED_ROOT_DIRECTORIES = [
  '.git',
  '.vscode',
  '.idea',
  '.sublime-text',
  '.history',
  '.edge',
  '.vercel',
];

/**
 * Whether the dev watcher must ignore a path.
 *
 * `node_modules` is ignored at any depth. Watching it is not just useless (a change there never rebuilt anything), it
 * is costly: chokidar 4 keeps a watcher per file (it dropped fsevents), so the node_modules of a real project, such
 * as a Gatsby one with pnpm, exhausts the open files limit (`EMFILE: too many open files`).
 */
export const isIgnoredByWatcher = (watchedPath: string): boolean => {
  const relativePath = path.isAbsolute(watchedPath)
    ? path.relative(process.cwd(), watchedPath)
    : watchedPath;
  const segments = relativePath.split(/[\\/]+/).filter((segment) => segment && segment !== '.');
  const [root] = segments;

  if (!root) return false;
  if (segments.includes('node_modules')) return true;
  if (IGNORED_ROOT_DIRECTORIES.includes(root)) return true;
  // temporary files that the build writes in the project root
  if (root.startsWith('.azion-bundler')) return true;
  if (segments.length === 1 && root.startsWith('azion') && root.includes('.temp')) return true;

  return false;
};
