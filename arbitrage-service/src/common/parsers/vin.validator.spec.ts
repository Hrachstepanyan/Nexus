import { isValidVINFormat } from './vin.validator';

describe('isValidVINFormat', () => {
  it('accepts a valid 17-character VIN', () => {
    expect(isValidVINFormat('1HGBH41JXMN109186')).toBe(true);
  });

  it('rejects a VIN with I, O, or Q', () => {
    expect(isValidVINFormat('1HGBH41JXIMN10918')).toBe(false);
    expect(isValidVINFormat('1HGBH41JXOMN10918')).toBe(false);
    expect(isValidVINFormat('1HGBH41JXQMN10918')).toBe(false);
  });

  it('rejects short VIN', () => {
    expect(isValidVINFormat('1HGBH41JXM')).toBe(false);
  });

  it('rejects long VIN', () => {
    expect(isValidVINFormat('1HGBH41JXMN10918699')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidVINFormat(null)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidVINFormat('')).toBe(false);
  });

  it('handles lowercase by converting to uppercase', () => {
    expect(isValidVINFormat('1hgbh41jxmn109186')).toBe(true);
  });
});
