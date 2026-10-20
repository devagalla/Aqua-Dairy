/**
 * Price Providers - Main Export
 *
 * Central export for all price provider functionality.
 */

export * from './types';
export * from './base';
export * from './fao';
export * from './registry';

// Re-export commonly used items from their actual sources
export {
  PriceProviderRegistry,
  priceRegistry,
  fetchMarketPrice,
} from './registry';

export { BasePriceProvider, createFetchResult } from './base';
export { FaoPriceProvider, faoProvider } from './fao';

export type {
  PriceProvider,
  PriceDataPoint,
  CountSize,
  ProviderConfig,
  ProviderFetchResult,
  ProviderRegistryEntry,
} from './types';