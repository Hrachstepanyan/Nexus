/**
 * Parses a mileage string like "45,200 mi" or "45200 miles" into a number (45200).
 * Returns null for invalid values.
 */
export function parseMileage(raw: string | undefined | null): number | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const cleaned = trimmed.replace(/[,\s]/g, '').replace(/mi(les?)?$/i, '');
  const value = parseInt(cleaned, 10);

  if (isNaN(value) || value < 0) return null;

  return value;
}
