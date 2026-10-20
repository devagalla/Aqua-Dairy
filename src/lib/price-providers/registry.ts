/**
 * Price Provider Registry
 *
 * Manages multiple price providers with priority-based fallback.
 * Automatically tries providers in order until one returns data.
 */

import type {
  PriceProvider,
  PriceDataPoint,
  CountSize,
  ProviderConfig,
  ProviderRegistryEntry,
  ProviderFetchResult,
} from './types';
import { BasePriceProvider, createFetchResult } from './base';
import { FaoPriceProvider, faoProvider } from './fao';

/** Built-in providers */
const BUILT_IN_PROVIDERS: PriceProvider[] = [
  faoProvider,
  // Add more providers here as they're implemented
  // new MpedaPriceProvider(),
  // new NoaaPriceProvider(),
  // new UrnerBarryProvider(),
];

export class PriceProviderRegistry {
  private providers: Map<string, ProviderRegistryEntry> = new Map();
  private defaultConfig: ProviderConfig = {
    cacheTtl: 24 * 60 * 60 * 1000,
    timeout: 10000,
  };

  constructor(customProviders: PriceProvider[] = [], configs: Record<string, ProviderConfig> = {}) {
    // Register built-in providers
    for (const provider of BUILT_IN_PROVIDERS) {
      this.register(provider, configs[provider.name]);
    }

    // Register custom providers (can override built-ins)
    for (const provider of customProviders) {
      this.register(provider, configs[provider.name]);
    }
  }

  /**
   * Register a provider with optional config
   */
  register(provider: PriceProvider, config?: ProviderConfig): void {
    const entry: ProviderRegistryEntry = {
      provider,
      priority: this.getDefaultPriority(provider.name),
      enabled: provider.isConfigured(),
      config,
    };

    if (config) {
      provider.constructor.name === 'FaoPriceProvider'
        ? Object.assign(provider, { config: { ...this.defaultConfig, ...config } })
        : null;
      // For other providers, they'd need a configure method
    }

    this.providers.set(provider.name, entry);
  }

  /**
   * Get default priority for known providers (lower = higher priority)
   */
  private getDefaultPriority(name: string): number {
    const priorities: Record<string, number> = {
      'fao': 10,
      'mpeda': 20,
      'noaa': 30,
      'urner_barry': 40,
      'mintec': 50,
      'tridge': 60,
    };
    return priorities[name] ?? 100;
  }

  /**
   * Set provider priority (lower = higher priority)
   */
  setPriority(name: string, priority: number): void {
    const entry = this.providers.get(name);
    if (entry) {
      entry.priority = priority;
    }
  }

  /**
   * Enable/disable a provider
   */
  setEnabled(name: string, enabled: boolean): void {
    const entry = this.providers.get(name);
    if (entry) {
      entry.enabled = enabled && entry.provider.isConfigured();
    }
  }

  /**
   * Get all registered providers sorted by priority
   */
  getProviders(): ProviderRegistryEntry[] {
    return Array.from(this.providers.values())
      .filter(e => e.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get a specific provider by name
   */
  getProvider(name: string): PriceProvider | null {
    return this.providers.get(name)?.provider ?? null;
  }

  /**
   * Fetch prices with automatic fallback
   * Tries providers in priority order until one returns data
   */
  async fetchPrices(
    region: string,
    countSize: CountSize,
    options: { preferredProvider?: string; skipCache?: boolean } = {}
  ): Promise<ProviderFetchResult<PriceDataPoint[]>> {
    const providers = this.getProviders();

    if (providers.length === 0) {
      return createFetchResult('none', [], 'No providers configured');
    }

    // If preferred provider specified, try it first
    let orderedProviders = providers;
    if (options.preferredProvider) {
      const preferred = providers.find(p => p.provider.name === options.preferredProvider);
      const others = providers.filter(p => p.provider.name !== options.preferredProvider);
      if (preferred) {
        orderedProviders = [preferred, ...others];
      }
    }

    let lastError: string | undefined;

    for (const entry of orderedProviders) {
      const provider = entry.provider;

      try {
        if (options.skipCache && provider.clearCache) {
          provider.clearCache();
        }

        const data = await provider.fetchPrices(region, countSize);

        if (data && data.length > 0) {
          return createFetchResult(provider.name, data);
        }

        lastError = `No data returned from ${provider.displayName}`;
      } catch (error) {
        lastError = `${provider.displayName}: ${error instanceof Error ? error.message : String(error)}`;
        console.warn(`[PriceRegistry] Provider ${provider.name} failed:`, lastError);
        continue; // Try next provider
      }
    }

    return createFetchResult('none', [], lastError || 'All providers failed');
  }

  /**
   * Fetch from all providers and merge results
   * Useful for comparison/debugging
   */
  async fetchFromAll(
    region: string,
    countSize: CountSize
  ): Promise<Record<string, ProviderFetchResult<PriceDataPoint[]>>> {
    const results: Record<string, ProviderFetchResult<PriceDataPoint[]>> = {};

    for (const entry of this.getProviders()) {
      try {
        const data = await entry.provider.fetchPrices(region, countSize);
        results[entry.provider.name] = createFetchResult(entry.provider.name, data);
      } catch (error) {
        results[entry.provider.name] = createFetchResult(
          entry.provider.name,
          [],
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return results;
  }

  /**
   * Get combined supported regions from all providers
   */
  async getAllSupportedRegions(): Promise<string[]> {
    const allRegions = new Set<string>();

    for (const entry of this.getProviders()) {
      if (entry.provider.getSupportedRegions) {
        const regions = await entry.provider.getSupportedRegions();
        regions.forEach(r => allRegions.add(r));
      }
    }

    return Array.from(allRegions).sort();
  }

  /**
   * Clear all provider caches
   */
  clearAllCaches(): void {
    for (const entry of this.providers.values()) {
      entry.provider.clearCache?.();
    }
  }

  /**
   * Get provider status for UI
   */
  getStatus(): Array<{
    name: string;
    displayName: string;
    enabled: boolean;
    configured: boolean;
    priority: number;
  }> {
    return Array.from(this.providers.values()).map(entry => ({
      name: entry.provider.name,
      displayName: entry.provider.displayName,
      enabled: entry.enabled,
      configured: entry.provider.isConfigured(),
      priority: entry.priority,
    }));
  }
}

/** Default singleton registry */
export const priceRegistry = new PriceProviderRegistry();

/**
 * Convenience function for simple fetching
 */
export async function fetchMarketPrice(
  region: string,
  countSize: CountSize
): Promise<PriceDataPoint[]> {
  const result = await priceRegistry.fetchPrices(region, countSize);
  return result.data ?? [];
}