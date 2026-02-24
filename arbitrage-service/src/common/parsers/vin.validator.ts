const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Validates a 17-character VIN including the check digit (position 9).
 * Returns true if valid, false otherwise.
 */
export function isValidVIN(vin: string | undefined | null): boolean {
  if (!vin || typeof vin !== 'string') return false;

  const upper = vin.trim().toUpperCase();

  // Must be exactly 17 characters
  if (upper.length !== 17) return false;

  // Must not contain I, O, Q
  if (/[IOQ]/.test(upper)) return false;

  // Must be alphanumeric
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(upper)) return false;

  // Check digit validation
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = upper[i];
    const value = /\d/.test(char) ? parseInt(char, 10) : TRANSLITERATION[char];
    if (value === undefined) return false;
    sum += value * WEIGHTS[i];
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 'X' : String(remainder);

  return upper[8] === checkDigit;
}

/**
 * Validates VIN format without check digit verification.
 * Useful for scraped data where check digits may be unreliable.
 */
export function isValidVINFormat(vin: string | undefined | null): boolean {
  if (!vin || typeof vin !== 'string') return false;

  const upper = vin.trim().toUpperCase();
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(upper);
}
