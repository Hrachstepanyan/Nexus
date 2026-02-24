import { normalizeTrim } from './trim.normalizer';

describe('normalizeTrim', () => {
  it('normalizes "M-Sport" to "M_SPORT"', () => {
    expect(normalizeTrim('M-Sport')).toBe('M_SPORT');
  });

  it('normalizes "MSport" to "M_SPORT"', () => {
    expect(normalizeTrim('MSport')).toBe('M_SPORT');
  });

  it('normalizes "M Sport" to "M_SPORT"', () => {
    expect(normalizeTrim('M Sport')).toBe('M_SPORT');
  });

  it('normalizes "base" to "BASE"', () => {
    expect(normalizeTrim('base')).toBe('BASE');
  });

  it('normalizes "XLE" to "XLE"', () => {
    expect(normalizeTrim('XLE')).toBe('XLE');
  });

  it('normalizes "EX-L" to "EX_L"', () => {
    expect(normalizeTrim('EX-L')).toBe('EX_L');
  });

  it('returns cleaned version for unknown trims', () => {
    expect(normalizeTrim('Custom Edition')).toBe('CUSTOM_EDITION');
  });

  it('returns null for empty string', () => {
    expect(normalizeTrim('')).toBeNull();
  });

  it('returns null for null', () => {
    expect(normalizeTrim(null)).toBeNull();
  });
});
