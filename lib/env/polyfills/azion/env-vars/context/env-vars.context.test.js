import { describe, it, beforeAll } from '@jest/globals';
import EnvVarsContext from './env-vars.context.js';

describe('env-vars context', () => {
  beforeAll(() => {
    process.env.MY_ENV_VAR = 'my-env-var-value';
  });

  it('should return the environment variable value', () => {
    const envVarsContext = EnvVarsContext;
    const value = envVarsContext.get('MY_ENV_VAR');
    expect(value).toBe('my-env-var-value');
  });

  it('should return undefined if the environment variable does not exist', () => {
    const envVarsContext = EnvVarsContext;
    const value = envVarsContext.get('MY_ENV_VAR_NOT_EXIST');
    expect(value).toBeUndefined();
  });
});
