export interface WaterLog {
  id: string;
  pond_id: string;
  created_at: string;
  logged_at: string; // ISO datetime
  temperature_c: number;
  pH: number;
  do_mg_l: number;
  salinity_pps: number;
  ammonia_mg_l: number;
  nitrite_mg_l: number;
  alkalinity_ppms: number;
  transparency_lux: number;
  comment?: string;
}
