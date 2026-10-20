/**
 * FAO Fisheries Price Provider
 *
 * Fetches shrimp/fish price data from FAO's public API.
 * FAO API: https://www.fao.org/fishery/api/v1
 *
 * Note: FAO provides global aggregate prices, not granular regional Indian market prices.
 * This serves as a baseline/trend indicator. For local Indian prices, we'll need
 * additional sources (MPEDA, NFDB, or commercial providers).
 */

import { BasePriceProvider } from './base';
import type {
  PriceProvider,
  PriceDataPoint,
  CountSize,
  ProviderConfig,
} from './types';

/** FAO Species codes relevant to shrimp */
const SHRIMP_SPECIES_CODES = {
  'Penaeus vannamei': 'WHITE SHRIMP', // Whiteleg shrimp (Vannamei)
  'Penaeus monodon': 'GIANT TIGER PRAWN', // Black tiger shrimp
  'Penaeus indicus': 'INDIAN WHITE PRAWN',
  'Metapenaeus monoceros': 'SPECKLED SHRIMP',
} as const;

/** Map FAO price data to our CountSize system */
function mapFaoSizeToCountSize(faoSizeCategory: string): CountSize | null {
  // FAO typically reports by size categories like "26/30", "31/40", etc.
  // These are count per pound, need conversion to count per kg
  // 1 kg = 2.20462 lbs
  const sizeMatch = faoSizeCategory.match(/(\d+)\/(\d+)/);
  if (sizeMatch) {
    const [, min, max] = sizeMatch;
    const avgPerLb = (parseInt(min) + parseInt(max)) / 2;
    const avgPerKg = Math.round(avgPerLb * 2.20462);
    // Snap to nearest standard count size
    const tiers: CountSize[] = [30, 40, 50, 60, 70, 80, 90, 100];
    return tiers.reduce((best, t) =>
      Math.abs(t - avgPerKg) < Math.abs(best - avgPerKg) ? t : best
    );
  }

  // Try direct number match (e.g., "30", "40")
  const directMatch = faoSizeCategory.match(/^(\d+)$/);
  if (directMatch) {
    const count = parseInt(directMatch[1]);
    const tiers: CountSize[] = [30, 40, 50, 60, 70, 80, 90, 100];
    return tiers.reduce((best, t) =>
      Math.abs(t - count) < Math.abs(best - count) ? t : best
    );
  }

  return null;
}

/** FAO API response types */
interface FaoPriceRecord {
  species: string;
  species_code: string;
  country: string;
  market: string;
  price: number;
  currency: string;
  unit: string; // e.g., "USD/kg", "EUR/kg"
  size_category?: string;
  date: string; // YYYY-MM-DD
  source: string;
}

interface FaoApiResponse {
  data: FaoPriceRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export class FaoPriceProvider extends BasePriceProvider implements PriceProvider {
  public readonly name = 'fao';
  public readonly displayName = 'FAO Fisheries';
  public readonly requiresConfig = false; // FAO API is free, no key needed

  private readonly baseUrl = 'https://www.fao.org/fishery/api/v1';
  private readonly speciesCache = new Map<string, string>();

  constructor(config: ProviderConfig = {}) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://www.fao.org/fishery/api/v1',
      cacheTtl: config.cacheTtl ?? 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  /**
   * Fetch prices for a specific region and count size from FAO.
   * Note: FAO data is country-level, not Indian-state-level.
   * We map Indian regions to "India" country and try to find relevant markets.
   */
  async fetchPrices(region: string, countSize: CountSize): Promise<PriceDataPoint[]> {
    const country = this.mapRegionToCountry(region);
    if (!country) {
      return []; // FAO doesn't have data for this region
    }

    return this.fetchWithCache(region, countSize, async () => {
      const prices: PriceDataPoint[] = [];

      // Fetch for each shrimp species
      for (const [species, commonName] of Object.entries(SHRIMP_SPECIES_CODES)) {
        try {
          const speciesPrices = await this.fetchSpeciesPrices(country, species, countSize);
          prices.push(...speciesPrices);
        } catch (error) {
          console.warn(`[FAO] Failed to fetch ${species} for ${country}:`, error);
        }
      }

      return prices;
    });
  }

  /**
   * Fetch prices for a specific species from FAO
   */
  private async fetchSpeciesPrices(
    country: string,
    species: string,
    targetCountSize: CountSize
  ): Promise<PriceDataPoint[]> {
    const url = `${this.config.baseUrl || this.baseUrl}/prices?country=${encodeURIComponent(country)}&species=${encodeURIComponent(species)}&limit=100`;

    const response = await this.fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`FAO API error: ${response.status} ${response.statusText}`);
    }

    const result: FaoApiResponse = await response.json();

    return result.data
      .filter(record => this.isRelevantRecord(record, targetCountSize))
      .map(record => this.transformFaoRecord(record, targetCountSize));
  }

  /**
   * Check if FAO record is relevant for our target count size
   */
  private isRelevantRecord(record: FaoPriceRecord, targetCountSize: CountSize): boolean {
    // Filter by size category if available
    if (record.size_category) {
      const mapped = mapFaoSizeToCountSize(record.size_category);
      if (mapped && mapped !== targetCountSize) {
        return false;
      }
    }

    // Must have valid price
    if (!record.price || record.price <= 0) {
      return false;
    }

    // Should be recent (within last 90 days)
    const recordDate = new Date(record.date);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    if (recordDate < ninetyDaysAgo) {
      return false;
    }

    return true;
  }

  /**
   * Transform FAO record to our PriceDataPoint format
   */
  private transformFaoRecord(record: FaoPriceRecord, targetCountSize: CountSize): PriceDataPoint {
    // Convert price to INR/kg if needed
    let pricePerKg = record.price;
    const currency = record.currency || 'USD';

    // FAO prices often in USD/kg or EUR/kg
    // For now, we'll store original currency and convert on display
    // In production, you'd want real-time FX rates

    return this.createPricePoint(
      record.market || record.country, // Use market name or country
      targetCountSize,
      pricePerKg,
      record.date,
      {
        source: 'fao',
        confidence: 'medium', // FAO is official but not local
        currency,
        speciesCode: record.species_code,
        metadata: {
          faoCountry: record.country,
          faoMarket: record.market,
          faoSpecies: record.species,
          faoSizeCategory: record.size_category,
          faoUnit: record.unit,
          faoSource: record.source,
        },
      }
    );
  }

  /**
   * Map Indian region names to FAO country codes
   */
  private mapRegionToCountry(region: string): string | null {
    const regionLower = region.toLowerCase();

    // Indian regions -> India
    const indianRegions = [
      'bhimavaram', 'nellore', 'surat', 'ongole', 'kakinada',
      'andhra', 'west godavari', 'east godavari', 'krishna', 'guntur',
      'tamil nadu', 'gujarat', 'kerala', 'odisha', 'west bengal',
      'maharashtra', 'karnataka', 'goa'
    ];

    if (indianRegions.some(r => regionLower.includes(r))) {
      return 'India';
    }

    // Other countries (if we expand)
    const countryMap: Record<string, string> = {
      'usa': 'United States of America',
      'united states': 'United States of America',
      'ecuador': 'Ecuador',
      'vietnam': 'Viet Nam',
      'thailand': 'Thailand',
      'indonesia': 'Indonesia',
      'china': 'China',
      'bangladesh': 'Bangladesh',
    };

    for (const [key, value] of Object.entries(countryMap)) {
      if (regionLower.includes(key)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Get supported regions - returns Indian states for our use case
   */
  async getSupportedRegions(): Promise<string[]> {
    // FAO has data for India as a country, but we expose Indian regions
    // that our app uses, knowing they'll all map to India in FAO
    return [
      'Bhimavaram', 'Nellore', 'Surat', 'Ongole', 'Kakinada',
      'Andhra Pradesh', 'Tamil Nadu', 'Gujarat', 'Kerala', 'Odisha'
    ];
  }

  /**
   * Get supported count sizes
   */
  getSupportedCountSizes(): CountSize[] {
    return [30, 40, 50, 60, 70, 80, 90, 100];
  }
}

/**
 * Singleton instance for easy importing
 */
export const faoProvider = new FaoPriceProvider();