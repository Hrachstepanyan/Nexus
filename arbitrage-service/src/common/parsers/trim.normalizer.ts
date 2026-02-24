const TRIM_MAP: Record<string, string> = {
  // BMW
  'M-SPORT': 'M_SPORT',
  'MSPORT': 'M_SPORT',
  'M SPORT': 'M_SPORT',
  'M-PKG': 'M_SPORT',

  // Common
  'BASE': 'BASE',
  'LIMITED': 'LIMITED',
  'SPORT': 'SPORT',
  'PREMIUM': 'PREMIUM',
  'TOURING': 'TOURING',

  // Toyota
  'SE': 'SE',
  'XLE': 'XLE',
  'XSE': 'XSE',
  'LE': 'LE',
  'TRD': 'TRD',
  'TRD OFF-ROAD': 'TRD_OFF_ROAD',
  'TRD PRO': 'TRD_PRO',

  // Honda
  'EX': 'EX',
  'EX-L': 'EX_L',
  'LX': 'LX',

  // Luxury
  'LUXURY': 'LUXURY',
  'EXECUTIVE': 'EXECUTIVE',
  'PRESTIGE': 'PRESTIGE',
  'SIGNATURE': 'SIGNATURE',
  'PLATINUM': 'PLATINUM',
  'TITANIUM': 'TITANIUM',
};

/**
 * Normalizes a trim string to a canonical form.
 * "M-Sport" | "MSport" | "M Sport" all become "M_SPORT".
 */
export function normalizeTrim(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== 'string') return null;

  const upper = raw.trim().toUpperCase();
  if (!upper) return null;

  // Direct lookup
  if (TRIM_MAP[upper]) return TRIM_MAP[upper];

  // Try without hyphens/spaces
  const stripped = upper.replace(/[-\s]/g, '');
  for (const [key, value] of Object.entries(TRIM_MAP)) {
    if (key.replace(/[-\s]/g, '') === stripped) return value;
  }

  // Return cleaned version if no mapping found
  return upper.replace(/[-\s]+/g, '_');
}
