/**
 * Median Absolute Deviation (MAD) outlier filter.
 * Uses modified Z-scores: modifiedZScore = 0.6745 * (x - median) / (1.4826 * MAD)
 * Excludes values where |Z| > threshold (default 3.5).
 */

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function calculateMAD(values: number[]): number {
  if (values.length === 0) return 0;
  const med = median(values);
  const deviations = values.map((v) => Math.abs(v - med));
  return median(deviations);
}

export function modifiedZScore(value: number, med: number, mad: number): number {
  if (mad === 0) return 0;
  return (0.6745 * (value - med)) / (1.4826 * mad);
}

/**
 * Filters outliers from a list of items using MAD.
 * @param items - Array of items to filter
 * @param getValue - Function to extract the numeric value to check
 * @param threshold - Modified Z-score threshold (default 3.5)
 * @returns Filtered array with outliers removed
 */
export function filterOutliers<T>(
  items: T[],
  getValue: (item: T) => number,
  threshold = 3.5,
): T[] {
  if (items.length < 3) return items;

  const values = items.map(getValue);
  const med = median(values);
  const mad = calculateMAD(values);

  if (mad === 0) return items;

  return items.filter((item) => {
    const z = modifiedZScore(getValue(item), med, mad);
    return Math.abs(z) <= threshold;
  });
}
