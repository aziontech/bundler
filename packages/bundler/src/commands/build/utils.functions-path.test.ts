import { describe, it, expect } from '@jest/globals';
import { getFunctionPathsFromEntry, verifyFunctionsOutputPath } from './utils';

describe('verifyFunctionsOutputPath', () => {
  const entry = { '.edge/functions/index': 'src/azion-index.temp.js' };

  it('does not throw when the path matches the generated file', () => {
    expect(() =>
      verifyFunctionsOutputPath(entry, [{ name: 'fn', path: './functions/index.js' }]),
    ).not.toThrow();
  });

  it('does not throw when the generated file has the dev suffix', () => {
    expect(() =>
      verifyFunctionsOutputPath({ '.edge/functions/index.dev': 'src/azion-index.temp.js' }, [
        { name: 'fn', path: './functions/index.js' },
      ]),
    ).not.toThrow();
  });

  it('reports the path to use and that the azion.config is not changed automatically', () => {
    expect(() =>
      verifyFunctionsOutputPath(entry, [{ name: 'fn', path: './functions/handler.js' }]),
    ).toThrow(
      /Update the path to "\.\/functions\/index\.js" in azion\.config\nThe build does not change your azion\.config automatically\. Adjust "build\.entry" and "functions\[\]\.path" in it so that they match\./,
    );
  });
});

describe('verifyFunctionsOutputPath message', () => {
  const entry = { '.edge/functions/index': 'src/azion-index.temp.js' };

  const messageOf = (run: () => void): string => {
    try {
      run();
    } catch (error) {
      return (error as Error).message;
    }
    throw new Error('should have thrown');
  };

  it('shows the configured path next to the build.entry and the file it generates', () => {
    const message = messageOf(() =>
      verifyFunctionsOutputPath(
        entry,
        [{ name: 'fn', path: './functions/handler.js' }],
        'index.js',
      ),
    );

    expect(message).toContain('      functions[0].path  "./functions/handler.js"');
    expect(message).toContain(
      '      build.entry        "index.js" (generates "./functions/index.js")',
    );
  });

  it('shows an entry with a single item as a string and the others as JSON', () => {
    const functions = [{ name: 'fn', path: './functions/handler.js' }];
    const single = messageOf(() => verifyFunctionsOutputPath(entry, functions, ['index.js']));
    const many = messageOf(() =>
      verifyFunctionsOutputPath(entry, functions, ['index.js', 'other.js']),
    );

    expect(single).toContain('build.entry        "index.js" (generates "./functions/index.js")');
    expect(many).toContain(
      'build.entry        ["index.js","other.js"] (generates "./functions/index.js")',
    );
  });

  it('shows all the generated files when the function has no entry of its own', () => {
    const message = messageOf(() =>
      verifyFunctionsOutputPath(
        entry,
        [
          { name: 'a', path: './functions/index.js' },
          { name: 'b', path: './functions/other.js' },
        ],
        'index.js',
      ),
    );

    expect(message).toContain('functions[1] ("b")');
    expect(message).toContain('functions[1].path  "./functions/other.js"');
  });

  it('keeps the message without the comparison when the build.entry is not known', () => {
    const message = messageOf(() =>
      verifyFunctionsOutputPath(entry, [{ name: 'fn', path: './functions/handler.js' }]),
    );

    expect(message).not.toContain('build.entry  ');
    expect(message).toContain('Update the path to "./functions/index.js" in azion.config');
  });
});

describe('getFunctionPathsFromEntry', () => {
  it('uses the name of the entry file', async () => {
    await expect(getFunctionPathsFromEntry('src/index.js')).resolves.toEqual([
      './functions/index.js',
    ]);
  });

  it('keeps the order of an entry array', async () => {
    await expect(getFunctionPathsFromEntry(['a.js', 'b/c.ts'])).resolves.toEqual([
      './functions/a.js',
      './functions/c.js',
    ]);
  });

  it('uses the keys of an entry object', async () => {
    await expect(getFunctionPathsFromEntry({ 'nested/main': 'src/index.js' })).resolves.toEqual([
      './functions/nested/main.js',
    ]);
  });
});
