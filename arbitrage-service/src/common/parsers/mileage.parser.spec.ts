import { parseMileage } from './mileage.parser';

describe('parseMileage', () => {
  it('parses "45,200 mi" to 45200', () => {
    expect(parseMileage('45,200 mi')).toBe(45200);
  });

  it('parses "45200 miles" to 45200', () => {
    expect(parseMileage('45200 miles')).toBe(45200);
  });

  it('parses "100000" to 100000', () => {
    expect(parseMileage('100000')).toBe(100000);
  });

  it('parses "12,345mi" without space', () => {
    expect(parseMileage('12,345mi')).toBe(12345);
  });

  it('returns null for empty string', () => {
    expect(parseMileage('')).toBeNull();
  });

  it('returns null for null', () => {
    expect(parseMileage(null)).toBeNull();
  });

  it('returns 0 for "0"', () => {
    expect(parseMileage('0')).toBe(0);
  });
});
