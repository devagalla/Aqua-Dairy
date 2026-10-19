/**
 * Pure conversion functions for area and stocking density
 */

export const SQ_M_PER_ACRE = 4046.86
export const SQ_M_PER_HECTARE = 10000

/**
 * Converts area in acres or hectares to square meters (m²)
 */
export function areaToSqMeters(area: number, unit: 'acre' | 'hectare'): number {
  if (unit === 'hectare') {
    return area * SQ_M_PER_HECTARE
  }
  return area * SQ_M_PER_ACRE
}

/**
 * Converts square meters to acres
 */
export function sqMetersToAcres(sqM: number): number {
  return sqM / SQ_M_PER_ACRE
}

/**
 * Converts stocking density between PL/m² and PL/acre (lakh PL / acre)
 * 1 lakh = 100,000
 */
export function densityToPlPerM2(densityLakhPerAcre: number): number {
  const plPerAcre = densityLakhPerAcre * 100000
  return plPerAcre / SQ_M_PER_ACRE
}

export function plPerM2ToLakhPerAcre(plPerM2: number): number {
  const plPerAcre = plPerM2 * SQ_M_PER_ACRE
  return plPerAcre / 100000
}

/**
 * Calculates total PL count from stocking density and pond area
 */
export function calculateTotalPl(area: number, areaUnit: 'acre' | 'hectare', densityPerM2: number): number {
  const areaSqM = areaToSqMeters(area, areaUnit)
  return Math.round(areaSqM * densityPerM2)
}
