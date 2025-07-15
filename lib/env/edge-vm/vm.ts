/**
 * This code was originally copied and modified from the @edge-runtime/vm repository.
 * Significant changes have been made to adapt it for use with Azion.
 */
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { CreateContextOptions } from 'vm';
import vm from 'node:vm';

export interface VMOptions<T> {
  /**
   * Provide code generation options to the Node.js VM.
   * If you don't provide any option, code generation will be disabled.
   */
  codeGeneration?: CreateContextOptions['codeGeneration'];
  /**
   * Allows to extend the VMContext. Note that it must return a contextified
   * object so ideally it should return the same reference it receives.
   */
  extend?: (context: VMContext) => VMContext & T;
}

/**
 * A raw VM with a context that can be extended on instantiation. Implements
 * a realm-like interface where one can evaluate code or require CommonJS
 * modules in multiple ways.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class VM<T extends Record<string | number, any>> {
  public readonly context: VMContext & T;

  constructor(options: VMOptions<T> = {}) {
    const context = vm.createContext(
      {},
      {
        name: 'Edge Runtime',
        codeGeneration: options.codeGeneration ?? {
          strings: false,
          wasm: true,
        },
      },
    ) as VMContext;

    this.context = options.extend?.(context) ?? (context as VMContext & T);
  }

  /**
   * Allows to run arbitrary code within the VM.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  evaluate<T = any>(code: string): T {
    return vm.runInContext(code, this.context, {
      importModuleDynamically: async (specifier: string) => {
        try {
          const fileUrl = pathToFileURL(resolve(specifier)).href;
          return await import(fileUrl);
        } catch (err) {
          if (process.env.DEBUG) {
            console.warn(
              '>>> [edge-runtime] dynamic import failed, returning empty module:',
              specifier,
            );
          }
          const mod = new vm.SourceTextModule('export default {}', { context: this.context });
          await mod.link(() => {
            return new vm.SourceTextModule('export {}', { context: this.context });
          });
          await mod.evaluate();
          return mod;
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}

export interface VMContext {
  Array: typeof Array;
  ArrayBuffer: typeof ArrayBuffer;
  Atomics: typeof Atomics;
  BigInt: typeof BigInt;
  BigInt64Array: typeof BigInt64Array;
  BigUint64Array: typeof BigUint64Array;
  Boolean: typeof Boolean;
  DataView: typeof DataView;
  Date: typeof Date;
  decodeURI: typeof decodeURI;
  decodeURIComponent: typeof decodeURIComponent;
  encodeURI: typeof encodeURI;
  encodeURIComponent: typeof encodeURIComponent;
  Error: typeof Error;
  EvalError: typeof EvalError;
  Float32Array: typeof Float32Array;
  Float64Array: typeof Float64Array;
  Function: typeof Function;
  Infinity: typeof Infinity;
  Int8Array: typeof Int8Array;
  Int16Array: typeof Int16Array;
  Int32Array: typeof Int32Array;
  Intl: typeof Intl;
  isFinite: typeof isFinite;
  isNaN: typeof isNaN;
  JSON: typeof JSON;
  Map: typeof Map;
  Math: typeof Math;
  Number: typeof Number;
  Object: typeof Object;
  parseFloat: typeof parseFloat;
  parseInt: typeof parseInt;
  Promise: typeof Promise;
  Proxy: typeof Proxy;
  RangeError: typeof RangeError;
  ReferenceError: typeof ReferenceError;
  Reflect: typeof Reflect;
  RegExp: typeof RegExp;
  Set: typeof Set;
  SharedArrayBuffer: typeof SharedArrayBuffer;
  String: typeof String;
  Symbol: typeof Symbol;
  SyntaxError: typeof SyntaxError;
  TypeError: typeof TypeError;
  Uint8Array: typeof Uint8Array;
  Uint8ClampedArray: typeof Uint8ClampedArray;
  Uint16Array: typeof Uint16Array;
  Uint32Array: typeof Uint32Array;
  URIError: typeof URIError;
  WeakMap: typeof WeakMap;
  WeakSet: typeof WeakSet;
  WebAssembly: typeof WebAssembly;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string | number]: any;
}
