/**
 * Abstract Base Price Provider
 *
 * Provides common functionality for all price providers:
 * - Caching with TTL
 * - Request timeout handling
 * - Error handling
 * - Configuration management
 */

import type {
  PriceProvider,
  PriceDataPoint,
  CountSize,
  ProviderConfig,
  ProviderFetchResult,
} from './types';

export abstract class BasePriceProvider implements PriceProvider {
  public abstract readonly name: string;
  public abstract readonly displayName: string;
  public abstract readonly requiresConfig: boolean;

  protected config: ProviderConfig = {};
  protected cache = new Map<string, { data: PriceDataPoint[]; expiresAt: number }>();
  protected defaultCacheTtl = 24 * 60 * 60 * 1000; // 24 hours
  protected defaultTimeout = 10000; // 10 seconds

  constructor(config: ProviderConfig = {}) {
    this.config = {
      timeout: this.defaultTimeout,
      cacheTtl: this.defaultCacheTtl,
      ...config,
    };
  }

  isConfigured(): boolean {
    if (!this.requiresConfig) return true;
    return Boolean(this.config.apiKey);
  }

  /**
   * Generate cache key for a fetch request
   */
  protected getCacheKey(region: string, countSize: CountSize): string {
    return `${this.name}:${region}:${countSize}`;
  }

  /**
   * Check if cached data is still valid
   */
  protected isCacheValid(expiresAt: number): boolean {
    return Date.now() < expiresAt;
  }

  /**
   * Get cached data if available and valid
   */
  protected getCached(region: string, countSize: CountSize): PriceDataPoint[] | null {
    const key = this.getCacheKey(region, countSize);
    const entry = this.cache.get(key);
    if (entry && this.isCacheValid(entry.expiresAt)) {
      return entry.data;
    }
    // Clean up expired entry
    if (entry) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Store data in cache
   */
  protected setCache(region: string, countSize: CountSize, data: PriceDataPoint[]): void {
    const key = this.getCacheKey(region, countSize);
    const ttl = this.config.cacheTtl ?? this.defaultCacheTtl;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Make HTTP request with timeout
   */
  protected async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = this.config.timeout ?? this.defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          ...this.config.headers,
          ...options.headers,
        },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  abstract fetchPrices(region: string, countSize: CountSize): Promise<PriceDataPoint[]>;

  /**
   * Optional: Fetch all prices for a region
   */
  async fetchAllPricesForRegion(region: string): Promise<PriceDataPoint[]> {
    const countSizes: CountSize[] = this.getSupportedCountSizes?.() ?? [30, 40, 50, 60, 70, 80, 90, 100];
    const results = await Promise.allSettled(
      countSizes.map(cs => this.fetchPrices(region, cs))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<PriceDataPoint[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);
  }

  /**
   * Optional: Get supported regions
   */
  async getSupportedRegions(): Promise<string[]> {
    return [];
  }

  /**
   * Optional: Get supported count sizes
   */
  getSupportedCountSizes(): CountSize[] {
    return [30, 40, 50, 60, 70, 80, 90, 100];
  }

  /**
   * Wrap fetch with error handling and caching
   */
  protected async fetchWithCache(
    region: string,
    countSize: CountSize,
    fetcher: () => Promise<PriceDataPoint[]>
  ): Promise<PriceDataPoint[]> {
    // Check cache first
    const cached = this.getCached(region, countSize);
    if (cached) {
      return cached;
    }

    try {
      const data = await fetcher();
      this.setCache(region, countSize, data);
      return data;
    } catch (error) {
      // Try to return stale cache on error
      const stale = this.cache.get(this.getCacheKey(region, countSize));
      if (stale) {
        console.warn(`[${this.name}] Using stale cache for ${region}/${countSize}:`, error);
        return stale.data;
      }
      throw error;
    }
  }

  /**
   * Create standardized price data point
   */
  protected createPricePoint(
    region: string,
    countSize: CountSize,
    pricePerKg: number,
    date: string,
    extra: Partial<PriceDataPoint> = {}
  ): PriceDataPoint {
    return {
      region,
      countSize,
      pricePerKg,
      date,
      source: this.name,
      confidence: 'medium', // Default, can be overridden
      currency: 'INR',
      ...extra,
    };
  }
}

/**
 * Utility function to create fetch result
 */
export function createFetchResult<T>(
  provider: string,
  data?: T,
  error?: string,
  fromCache = false
): ProviderFetchResult<T> {
  return {
    success: !error && data !== undefined,
    data,
    error,
    provider,
    fetchedAt: new Date().toISOString(),
    fromCache,
  };
}