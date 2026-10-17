// Calculate Average Body Weight (ABW)
// ABW = Total Weight / Number of Individuals
export function calculateABW(totalWeightKg: number, individualCount: number): number {
  if (individualCount <= 0) return 0;
  return totalWeightKg / individualCount;
}

// Calculate Biomass
// Biomass = Number of Individuals × Average Body Weight
export function calculateBiomass(individualCount: number, averageWeightKg: number): number {
  if (individualCount <= 0 || averageWeightKg <= 0) return 0;
  return individualCount * averageWeightKg;
}

// Calculate Feed Conversion Ratio (FCR)
// FCR = Total Feed Given (kg) / Weight Gain (kg)
export function calculateFCR(totalFeedKg: number, weightGainKg: number): number {
  if (weightGainKg <= 0) return 0;
  return totalFeedKg / weightGainKg;
}

// Calculate culture days from stocking date
export function calculateCultureDays(stockingDate: string | Date, currentDate: string | Date = new Date()): number {
  const stockDate = new Date(stockingDate);
  const currDate = new Date(currentDate);

  if (isNaN(stockDate.getTime())) {
    return 0;
  }
  if (isNaN(currDate.getTime())) {
    return 0;
  }
  const timeDiff = currDate.getTime() - stockDate.getTime();
  if (timeDiff < 0) {
    return 0;
  }
  if (timeDiff === 0) {
    return 1;
  }
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

// Calculate expected harvest date based on stocking date and target harvest days
export function calculateExpectedHarvestDate(stockingDate: string | Date, targetHarvestDays: number): string {
  const stockDate = new Date(stockingDate);

  if (isNaN(stockDate.getTime()) || targetHarvestDays <= 0) {
    return '';
  }

  const expectedDate = new Date(stockDate.getTime() + (targetHarvestDays * 24 * 60 * 60 * 1000));
  return expectedDate.toISOString().split('T')[0];
}

// Calculate survival rate percentage
export function calculateSurvivalRate(initialStock: number, currentCount: number): number {
  if (initialStock <= 0) return 0;
  return Math.min(100, (currentCount / initialStock) * 100);
}

// Calculate projected biomass at harvest based on current ABW and target harvest weight
export function calculateProjectedBiomass(currentAbwKg: number, targetAbwKg: number, individualCount: number): number {
  if (individualCount <= 0 || currentAbwKg <= 0 || targetAbwKg <= 0) return 0;
  const survivalAssumed = 0.85; // Assume 85% survival to harvest
  return individualCount * survivalAssumed * targetAbwKg;
}