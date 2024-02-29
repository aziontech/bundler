/* eslint-disable no-undef */
import { describe, it, jest } from '@jest/globals';
import EnvVarsContext from './context/env-vars.context.js';
import './env-vars.polyfills.js';

jest.mock('./context/index.js');
global.ENV_VARS_CONTEXT = EnvVarsContext;

describe('env-vars polyfills', () => {
  beforeAll(() => {
    process.env.MY_ENV_VAR = 'my-env-var-value';
  });

  it('should return the environment variable value', () => {
    const value = Azion.env.get('MY_ENV_VAR');
    expect(value).toBe('my-env-var-value');
  });
  it('should return undefined if the environment variable does not exist', () => {
    const value = Azion.env.get('MY_ENV_VAR_NOT_EXIST');
    expect(value).toBeUndefined();
  });
});
