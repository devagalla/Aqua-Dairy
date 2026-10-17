// Water parameter thresholds based on advisor rules
export const WATER_PARAMETER_THRESHOLDS = {
  // DO (Dissolved Oxygen)
  DO_MG_L_MIN: 4.0,
  DO_MG_L_MAX: null,

  // pH
  PH_MIN: 7.5,
  PH_MAX: 8.5,

  // Ammonia
  AMMONIA_MG_L_MIN: null,
  AMMONIA_MG_L_MAX: 0.1,

  // Nitrite
  NITRITE_MG_L_MIN: null,
  NITRITE_MG_L_MAX: 0.5,

  // Alkalinity
  ALKALINITY_PPMS_MIN: 20.0,
  ALKALINITY_PPMS_MAX: 400.0,

  // Temperature
  TEMPERATURE_C_MIN: 25.0,
  TEMPERATURE_C_MAX: 32.0,

  // Salinity
  SALINITY_PPS_MIN: 0.0,
  SALINITY_PPS_MAX: 35.0,

  // Transparency
  TRANSPARENCY_LUX_MIN: 30.0,
  TRANSPARENCY_LUX_MAX: null,
};

// Enum values
export const SEVERITY_LEVELS = ['GREEN', 'YELLOW', 'RED'] as const;
export type SeverityLevel = typeof SEVERITY_LEVELS[number];

export const FARM_ROLES = ['Farmer', 'Manager', 'Admin'] as const;
export type FarmRole = typeof FARM_ROLES[number];

export const WATER_PARAMETERS = [
  'temperatureC',
  'pH',
  'doMgL',
  'salinityPps',
  'ammoniaMgL',
  'nitriteMgL',
  'alkalinityPpms',
  'transparencyLux'
] as const;
export type WaterParameter = typeof WATER_PARAMETERS[number];