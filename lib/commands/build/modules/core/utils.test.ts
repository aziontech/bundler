import { describe, it, expect } from '@jest/globals';
import { moveImportsToTopLevel, relocateImportsAndRequires } from './utils';
import { injectHybridFsPolyfill } from './utils';
import type { BuildConfiguration, BuildContext, AzionBuildPreset } from 'azion/config';

describe('moveImportsToTopLevel', () => {
  it('should move import statements to the top of the file', () => {
    const code = `const x = 1;
import { foo } from 'foo';
const y = 2;
import { bar } from 'bar';`;

    const result = moveImportsToTopLevel(code);

    expect(result).toBe(`import { foo } from 'foo';
import { bar } from 'bar';

const x = 1;

const y = 2;`);
  });

  it('should move require statements to the top of the file', () => {
    const code = `const x = 1;
const foo = require('foo');
const y = 2;
const bar = require('bar');`;

    const result = moveImportsToTopLevel(code);

    expect(result).toBe(`const foo = require('foo');
const bar = require('bar');

const x = 1;

const y = 2;`);
  });

  it('should handle mixed import and require statements', () => {
    const code = `const x = 1;
import { foo } from 'foo';
const y = 2;
const bar = require('bar');`;

    const result = moveImportsToTopLevel(code);

    expect(result).toBe(`import { foo } from 'foo';
const bar = require('bar');

const x = 1;

const y = 2;`);
  });

  it('should handle code with no import or require statements', () => {
    const code = `const x = 1;
const y = 2;`;

    const result = moveImportsToTopLevel(code);

    expect(result).toBe(`const x = 1;
const y = 2;`);
  });
});

describe('relocateImportsAndRequires', () => {
  it('should move imports to top like moveImportsToTopLevel', () => {
    const code = `const x = 1;
import { foo } from 'foo';`;

    const result = relocateImportsAndRequires(code);
    expect(result).toBe(`import { foo } from 'foo';
const x = 1;
`);
  });
});

describe('injectHybridFsPolyfill', () => {
  const mockBuildConfig: BuildConfiguration = {
    polyfills: false,
    worker: false,
    bundler: 'esbuild',
    entry: {},
    preset: {} as AzionBuildPreset,
    setup: {
      contentToInject: undefined,
      defineVars: {},
    },
  };

  const mockContext: BuildContext = {
    production: false,
    handler: 'handler.js',
  };

  it('should not inject polyfill when polyfills is false', () => {
    const code = `const x = 1;`;
    const result = injectHybridFsPolyfill(code, mockBuildConfig, mockContext);
    expect(result).toBe(code);
  });

  it('should not inject polyfill when not in production', () => {
    const code = `const x = 1;`;
    const config = { ...mockBuildConfig, polyfills: true };
    const result = injectHybridFsPolyfill(code, config, mockContext);
    expect(result).toBe(code);
  });

  it('should inject polyfill when polyfills is true and in production', () => {
    const code = `const x = 1;`;
    const config = { ...mockBuildConfig, polyfills: true };
    const ctx = { production: true, entrypoint: [], handler: 'handler.js' };

    const result = injectHybridFsPolyfill(code, config, ctx);
    expect(result).toBe(`import SRC_NODE_FS from "node:fs";\nconst x = 1;`);
  });
});
