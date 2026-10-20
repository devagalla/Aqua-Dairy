/**
 * Price Provider Abstraction Layer
 *
 * Defines interfaces for fetching market price data from various sources.
 * Providers can be free (FAO, NOAA) or commercial (Urner Barry, Mintec).
 */

export type CountSize = 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;

export interface PriceDataPoint {
  /** Region/market name (e.g., "Bhimavaram", "Nellore") */
  region: string;
  /** Shrimp count per kg */
  countSize: CountSize;
  /** Price per kg in local currency */
  pricePerKg: number;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
  /** Source identifier (e.g., "fao", "manual", "mpeda") */
  source: string;
  /** Confidence level based on data freshness/quality */
  confidence: 'high' | 'medium' | 'low';
  /** Original currency (usually INR for Indian markets) */
  currency?: string;
  /** Optional: original species code from provider */
  speciesCode?: string;
  /** Optional: raw provider metadata */
  metadata?: Record<string, unknown>;
}

export interface PriceProvider {
  /** Unique identifier for this provider */
  readonly name: string;
  /** Human-readable display name */
  readonly displayName: string;
  /** Whether this provider requires API keys/configuration */
  readonly requiresConfig: boolean;
  /** Whether this provider is currently configured and ready */
  isConfigured(): boolean;
  /**
   * Fetch prices for a specific region and count size.
   * Returns empty array if no data available for that combination.
   */
  fetchPrices(region: string, countSize: CountSize): Promise<PriceDataPoint[]>;
  /**
   * Fetch all available prices for a region (all count sizes).
   * Optional - defaults to calling fetchPrices for each known count size.
   */
  fetchAllPricesForRegion?(region: string): Promise<PriceDataPoint[]>;
  /**
   * Get list of regions this provider has data for.
   * Optional - used for UI region selection.
   */
  getSupportedRegions?(): Promise<string[]>;
  /**
   * Get list of count sizes this provider supports.
   * Optional - defaults to standard 30-100 range.
   */
  getSupportedCountSizes?(): CountSize[];
  /**
   * Clear any cached data.
   * Optional - for providers that implement caching.
   */
  clearCache?(): void;
}

export interface ProviderConfig {
  /** API key if required */
  apiKey?: string;
  /** Base URL override */
  baseUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Cache TTL in ms */
  cacheTtl?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

/** Result of a provider fetch operation */
export interface ProviderFetchResult<T = PriceDataPoint[]> {
  /** Whether the fetch succeeded */
  success: boolean;
  /** Data if successful */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Provider name that was used */
  provider: string;
  /** Timestamp of fetch */
  fetchedAt: string;
  /** Whether data came from cache */
  fromCache?: boolean;
}

/** Registry entry for a provider */
export interface ProviderRegistryEntry {
  provider: PriceProvider;
  priority: number; // Lower = higher priority
  enabled: boolean;
  config?: ProviderConfig;
}