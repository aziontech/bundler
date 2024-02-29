import mockFs from 'mock-fs';
import fs from 'fs';
import { expect } from '@jest/globals';
import relocateImportsAndRequires from './relocateImportsAndRequires.utils.js';

describe('relocateImportsAndRequires.utils', () => {
  it('should relocate imports and requires to file init while preserving comments', async () => {
    mockFs({
      '/entry.js': `
        // This is a comment
        import { foo } from 'foo';
        const qux = require('qux');
        console.log('Hello world!');
        function bar() {
          console.log('Hello world!');
        }
        const baz = require('baz');
        import { baj } from 'baj';
    `,
    });

    const expected = `
import { foo } from 'foo';
import { baj } from 'baj';
const qux = require('qux');
const baz = require('baz');

        // This is a comment
        
        
        console.log('Hello world!');
        function bar() {
          console.log('Hello world!');
        }
    `;

    const entryContent = fs.readFileSync('/entry.js', 'utf8');
    const newCode = relocateImportsAndRequires(entryContent);

    expect(newCode.trim()).toEqual(expected.trim());
    mockFs.restore();
  });
});
