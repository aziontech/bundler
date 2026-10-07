import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { AzionBuildPreset } from '@aziontech/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveHandlers } from './handler';

describe('resolveHandlers by config version', () => {
  let dir: string;
  let previousCwd: string;

  beforeEach(() => {
    previousCwd = process.cwd();
    dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'handler-')));
    process.chdir(dir);
    fs.writeFileSync('handler.js', 'export default {}');
    fs.writeFileSync('index.js', 'export default {}');
    fs.writeFileSync('server.mjs', 'export default {}');
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const preset = (config: unknown, configs: unknown) =>
    ({ metadata: { name: 'demo' }, config, configs }) as unknown as AzionBuildPreset;

  it('uses the default entry of the config of the project version', async () => {
    const javascript = preset(
      { build: { entry: 'index.js' } },
      { 3: { version: 3, build: { entry: 'handler.js' } }, 4: { build: { entry: 'index.js' } } },
    );

    expect(
      await resolveHandlers({ entrypoint: undefined, preset: javascript, version: 3 }),
    ).toEqual([path.resolve('handler.js')]);
    expect(
      await resolveHandlers({ entrypoint: undefined, preset: javascript, version: 4 }),
    ).toEqual([path.resolve('index.js')]);
  });

  it('uses the entry a prebuild set on preset.config when the v3 config declares none (nuxt, svelte)', async () => {
    const switched = preset({ build: { entry: 'server.mjs' } }, { 3: { version: 3, build: {} } });

    expect(await resolveHandlers({ entrypoint: undefined, preset: switched, version: 3 })).toEqual([
      path.resolve('server.mjs'),
    ]);
  });
});
