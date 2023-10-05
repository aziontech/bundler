import getExportedFunctionBody from './getExportedFunctionBody.utils.js';

describe('getExportedFunctionBody', () => {
  it('should extract the body from a default exported function declaration', () => {
    const inputCode = `
      export default function test() {
        return 'Hello, world!';
      }
    `;

    const expectedOutput = `
      return 'Hello, world!';
    `;

    expect(getExportedFunctionBody(inputCode).replace(/\s/g, '')).toBe(
      expectedOutput.replace(/\s/g, ''),
    );
  });

  it('should extract the body from a default exported anonymous function', () => {
    const inputCode = `
      export default function() {
        return 'Hello, world!';
      }
    `;

    const expectedOutput = `
      return 'Hello, world!';
    `;

    expect(getExportedFunctionBody(inputCode).replace(/\s/g, '')).toBe(
      expectedOutput.replace(/\s/g, ''),
    );
  });

  it('should extract the body from a default exported arrow function', () => {
    const inputCode = `
      export default () => {
        return 'Hello, world!';
      }
    `;

    const expectedOutput = `
      return 'Hello, world!';
    `;

    expect(getExportedFunctionBody(inputCode).replace(/\s/g, '')).toBe(
      expectedOutput.replace(/\s/g, ''),
    );
  });

  it('should extract the body from a default exported function assigned to a variable', () => {
    const inputCode = `
      const test = function() {
        return 'Hello, world!';
      }
      export default test;
    `;

    const expectedOutput = `
      return 'Hello, world!';
    `;

    expect(getExportedFunctionBody(inputCode).replace(/\s/g, '')).toBe(
      expectedOutput.replace(/\s/g, ''),
    );
  });

  it('should throw an error if there are no default exports', () => {
    const inputCode = `
      export function test() {
        return 'Hello, world!';
      }
    `;

    expect(() => getExportedFunctionBody(inputCode)).toThrow(
      'No default exports were found for entrypoint in the provided code.',
    );
  });
});
