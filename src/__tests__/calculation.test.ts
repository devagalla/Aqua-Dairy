import {
  calculateABW,
  calculateBiomass,
  calculateFCR,
  calculateCultureDays,
  calculateExpectedHarvestDate,
  calculateSurvivalRate,
  calculateProjectedBiomass
} from '@/utils/calculation';

describe('Calculation Utilities', () => {
  describe('calculateABW', () => {
    it('should calculate ABW correctly', () => {
      expect(calculateABW(100, 10)).toBe(10);
      expect(calculateABW(50, 5)).toBe(10);
      expect(calculateABW(0, 10)).toBe(0);
    });

    it('should return 0 for zero or negative individual count', () => {
      expect(calculateABW(100, 0)).toBe(0);
      expect(calculateABW(100, -5)).toBe(0);
    });
  });

  describe('calculateBiomass', () => {
    it('should calculate biomass correctly', () => {
      expect(calculateBiomass(10, 5)).toBe(50);
      expect(calculateBiomass(100, 2.5)).toBe(250);
    });

    it('should return 0 for zero or negative inputs', () => {
      expect(calculateBiomass(0, 5)).toBe(0);
      expect(calculateBiomass(10, 0)).toBe(0);
      expect(calculateBiomass(-5, 5)).toBe(0);
      expect(calculateBiomass(5, -2)).toBe(0);
    });
  });

  describe('calculateFCR', () => {
    it('should calculate FCR correctly', () => {
      expect(calculateFCR(100, 20)).toBe(5);
      expect(calculateFCR(50, 10)).toBe(5);
    });

    it('should return 0 for zero or negative weight gain', () => {
      expect(calculateFCR(100, 0)).toBe(0);
      expect(calculateFCR(100, -5)).toBe(0);
    });
  });

  describe('calculateCultureDays', () => {
    it('should calculate culture days correctly', () => {
      // Mock date for consistent testing
      const fixedDate = new Date('2026-10-17');
      jest.useFakeTimers();
      jest.setSystemTime(fixedDate);

      // 7 days ago
      const stockingDate = new Date('2026-10-10');
      expect(calculateCultureDays(stockingDate)).toBe(7);

      // Today
      expect(calculateCultureDays(fixedDate)).toBe(1);

      jest.useRealTimers();
    });

    it('should return 0 for invalid dates', () => {
      expect(calculateCultureDays('invalid-date')).toBe(0);
      expect(calculateCultureDays(NaN as any)).toBe(0);
    });

    it('should handle future stocking dates', () => {
      const fixedDate = new Date('2026-10-17');
      jest.useFakeTimers();
      jest.setSystemTime(fixedDate);

      const futureDate = new Date('2026-10-20');
      expect(calculateCultureDays(futureDate)).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('calculateExpectedHarvestDate', () => {
    it('should calculate expected harvest date correctly', () => {
      const stockingDate = '2026-10-10';
      const targetDays = 30;
      const expected = '2026-11-09'; // 30 days from Oct 10
      expect(calculateExpectedHarvestDate(stockingDate, targetDays)).toBe(expected);
    });

    it('should handle invalid inputs', () => {
      expect(calculateExpectedHarvestDate('invalid-date', 30)).toBe('');
      expect(calculateExpectedHarvestDate('2026-10-10', 0)).toBe('');
      expect(calculateExpectedHarvestDate('2026-10-10', -5)).toBe('');
    });
  });

  describe('calculateSurvivalRate', () => {
    it('should calculate survival rate correctly', () => {
      expect(calculateSurvivalRate(100, 85)).toBe(85);
      expect(calculateSurvivalRate(100, 50)).toBe(50);
      expect(calculateSurvivalRate(1000, 1000)).toBe(100);
    });

    it('should cap at 100%', () => {
      expect(calculateSurvivalRate(100, 150)).toBe(100);
      expect(calculateSurvivalRate(50, 100)).toBe(100);
    });

    it('should return 0 for zero initial stock', () => {
      expect(calculateSurvivalRate(0, 100)).toBe(0);
      expect(calculateSurvivalRate(0, 0)).toBe(0);
    });
  });

  describe('calculateProjectedBiomass', () => {
    it('should calculate projected biomass correctly', () => {
      // 1000 individuals, 85% survival assumed, target ABW 1.5kg
      expect(calculateProjectedBiomass(0.5, 1.5, 1000)).toBe(1275); // 1000 * 0.85 * 1.5
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateProjectedBiomass(0, 1.5, 1000)).toBe(0);
      expect(calculateProjectedBiomass(0.5, 0, 1000)).toBe(0);
      expect(calculateProjectedBiomass(0.5, 1.5, 0)).toBe(0);
    });
  });
});