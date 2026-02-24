const NON_PRICE_PATTERNS = [
  /call\s*for\s*price/i,
  /n\/a/i,
  /not\s*available/i,
  /contact/i,
  /request/i,
  /inquire/i,
];

/**
 * Parses a price string like "$23,500" into cents (2350000).
 * Returns null for non-numeric values like "Call for Price".
 */
export function parsePrice(raw: string | undefined | null): number | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  for (const pattern of NON_PRICE_PATTERNS) {
    if (pattern.test(trimmed)) return null;
  }

  const cleaned = trimmed.replace(/[$,\s]/g, '');
  const value = parseFloat(cleaned);

  if (isNaN(value) || value <= 0) return null;

  return Math.round(value * 100);
}
