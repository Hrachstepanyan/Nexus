import { filterOutliers, calculateMAD, modifiedZScore } from './outlier.filter';

describe('outlier filter', () => {
  describe('calculateMAD', () => {
    it('calculates MAD correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      // Median is 5, deviations are [4,3,2,1,0,1,2,3,4], MAD = 2
      expect(calculateMAD(values)).toBe(2);
    });

    it('returns 0 for empty array', () => {
      expect(calculateMAD([])).toBe(0);
    });

    it('returns 0 for single element', () => {
      expect(calculateMAD([5])).toBe(0);
    });
  });

  describe('modifiedZScore', () => {
    it('returns 0 when MAD is 0', () => {
      expect(modifiedZScore(10, 5, 0)).toBe(0);
    });

    it('calculates positive z-score for above-median values', () => {
      const z = modifiedZScore(100, 50, 10);
      expect(z).toBeGreaterThan(0);
    });

    it('calculates negative z-score for below-median values', () => {
      const z = modifiedZScore(10, 50, 10);
      expect(z).toBeLessThan(0);
    });
  });

  describe('filterOutliers', () => {
    it('removes extreme outliers', () => {
      const items = [
        { price: 20000 },
        { price: 22000 },
        { price: 21000 },
        { price: 23000 },
        { price: 19000 },
        { price: 100000 }, // outlier
      ];

      const filtered = filterOutliers(items, (i) => i.price);
      expect(filtered.length).toBe(5);
      expect(filtered.find((i) => i.price === 100000)).toBeUndefined();
    });

    it('returns all items when no outliers', () => {
      const items = [
        { price: 20000 },
        { price: 21000 },
        { price: 22000 },
        { price: 23000 },
      ];

      const filtered = filterOutliers(items, (i) => i.price);
      expect(filtered.length).toBe(4);
    });

    it('returns all items when fewer than 3', () => {
      const items = [{ price: 100 }, { price: 100000 }];
      const filtered = filterOutliers(items, (i) => i.price);
      expect(filtered.length).toBe(2);
    });
  });
});
