import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import chokidar from 'chokidar';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { isIgnoredByWatcher } from './watch-ignore';

describe('isIgnoredByWatcher', () => {
  it.each([
    'node_modules',
    'node_modules/.pnpm/p-locate@3.0.0',
    'node_modules/.pnpm/lodash@4/node_modules/lodash/startsWith.js',
    'packages/app/node_modules/react/index.js',
    '.git',
    '.git/HEAD',
    '.vscode/settings.json',
    '.idea',
    '.sublime-text',
    '.history',
    '.edge',
    '.edge/storage/index.html',
    '.vercel/output',
    '.azion-bundler.json',
    'azion-handler-20260101.temp.js',
    './node_modules/x',
  ])('ignores %s', (watchedPath) => {
    expect(isIgnoredByWatcher(watchedPath)).toBe(true);
  });

  it.each([
    '',
    '.',
    'src',
    'src/index.ts',
    'public/index.html',
    '.cache',
    'azion.config.mjs',
    'src/azion-handler.temp.js',
    'packages/app/src/main.ts',
  ])('does not ignore %s', (watchedPath) => {
    expect(isIgnoredByWatcher(watchedPath)).toBe(false);
  });

  it('works with an absolute path inside the project', () => {
    expect(isIgnoredByWatcher(path.join(process.cwd(), 'node_modules', 'x', 'index.js'))).toBe(
      true,
    );
    expect(isIgnoredByWatcher(path.join(process.cwd(), 'src', 'index.ts'))).toBe(false);
  });
});

describe('chokidar with isIgnoredByWatcher', () => {
  let dir: string;
  let previousCwd: string;

  beforeEach(() => {
    previousCwd = process.cwd();
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'watch-')));
    process.chdir(dir);
    fs.mkdirSync('node_modules/.pnpm/pkg@1.0.0/node_modules/pkg', { recursive: true });
    fs.writeFileSync('node_modules/.pnpm/pkg@1.0.0/node_modules/pkg/index.js', 'x');
    fs.mkdirSync('src');
    fs.writeFileSync('src/a.txt', '1');
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('does not traverse node_modules and still reports the changes of the project', async () => {
    const events: string[] = [];
    const watcher = chokidar.watch('./', {
      persistent: true,
      ignoreInitial: true,
      depth: 99,
      ignored: isIgnoredByWatcher,
    });
    watcher.on('all', (event, changed) => events.push(`${event}:${changed}`));

    await new Promise<void>((resolve) => watcher.on('ready', () => resolve()));
    const watched = Object.keys(watcher.getWatched()).join('|');

    fs.writeFileSync('src/a.txt', 'changed');
    fs.writeFileSync('node_modules/.pnpm/pkg@1.0.0/node_modules/pkg/index.js', 'changed');
    await new Promise((resolve) => setTimeout(resolve, 800));
    await watcher.close();

    expect(watched).not.toContain('node_modules');
    expect(events).toContain('change:src/a.txt');
    expect(events.some((event) => event.includes('node_modules'))).toBe(false);
  });
});
