import { parsePrice } from './price.parser';

describe('parsePrice', () => {
  it('parses "$23,500" to 2350000 cents', () => {
    expect(parsePrice('$23,500')).toBe(2350000);
  });

  it('parses "23500" to 2350000 cents', () => {
    expect(parsePrice('23500')).toBe(2350000);
  });

  it('parses "$1,234.56" to 123456 cents', () => {
    expect(parsePrice('$1,234.56')).toBe(123456);
  });

  it('parses " $45,000 " with whitespace', () => {
    expect(parsePrice(' $45,000 ')).toBe(4500000);
  });

  it('returns null for "Call for Price"', () => {
    expect(parsePrice('Call for Price')).toBeNull();
  });

  it('returns null for "N/A"', () => {
    expect(parsePrice('N/A')).toBeNull();
  });

  it('returns null for "Contact Dealer"', () => {
    expect(parsePrice('Contact Dealer')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parsePrice('')).toBeNull();
  });

  it('returns null for null', () => {
    expect(parsePrice(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(parsePrice(undefined)).toBeNull();
  });

  it('returns null for negative price', () => {
    expect(parsePrice('-1000')).toBeNull();
  });
});
