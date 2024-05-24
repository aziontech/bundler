import { getNextPhase, isLocaleTrailingSlashRegex } from './utils.js';

describe('getNextPhase', () => {
  it('should return "filesystem" when current phase is "none"', () => {
    expect(getNextPhase('none')).toBe('filesystem');
  });

  it('should return "rewrite" when current phase is "filesystem"', () => {
    expect(getNextPhase('filesystem')).toBe('rewrite');
  });

  it('should return "resource" when current phase is "rewrite"', () => {
    expect(getNextPhase('rewrite')).toBe('resource');
  });

  it('should return "miss" when current phase is "resource"', () => {
    expect(getNextPhase('resource')).toBe('miss');
  });

  it('should return "miss" for any other phase', () => {
    expect(getNextPhase('someOtherPhase')).toBe('miss');
  });
});

describe('isLocaleTrailingSlashRegex', () => {
  const locales = {
    en: true,
    fr: true,
    nl: true,
  };

  it('should return true for a valid source with a single locale and trailing slash', () => {
    const src = '^//?(?:en)/(.*)';
    expect(isLocaleTrailingSlashRegex(src, locales)).toBe(true);
  });

  it('should return true for a valid source with multiple locales and trailing slash', () => {
    const src = '^//?(?:en|fr|nl)/(.*)';
    expect(isLocaleTrailingSlashRegex(src, locales)).toBe(true);
  });

  it('should return false for a source without trailing slash', () => {
    const src = '^//?en/(.*)$';
    expect(isLocaleTrailingSlashRegex(src, locales)).toBe(false);
  });

  it('should return false for a source with an invalid locale', () => {
    const src = '^//?de/(.*)$';
    expect(isLocaleTrailingSlashRegex(src, locales)).toBe(false);
  });

  it('should return false for a source with an invalid format', () => {
    const src = 'invalid-source';
    expect(isLocaleTrailingSlashRegex(src, locales)).toBe(false);
  });
});
