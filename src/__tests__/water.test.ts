import { WaterSchema, evaluateRules } from '@/utils/validation';
import type { SupabaseClient } from '@supabase/supabase-js';

class MockSupabase {
  from(table: string) {
    return {
      select: () => ({
        eq: () => ({
          data: [
            {
              id: 'rule-1',
              parameter: 'do_mg_l',
              min_threshold: 4.0,
              max_threshold: null,
              severity: 'RED',
              message_en: 'Low DO',
              action_en: 'Aerate',
              enabled: true,
            },
            {
              id: 'rule-2',
              parameter: 'pH',
              min_threshold: 7.5,
              max_threshold: 8.5,
              severity: 'YELLOW',
              message_en: 'pH out of range',
              action_en: 'Adjust',
              enabled: true,
            },
          ],
        }),
      }),
    };
  }
}

describe('WaterSchema validation', () => {
  it('accepts valid water log', () => {
    const valid = {
      cycle_id: '123e4567-e89b-12d3-a456-426614174000',
      logged_at: new Date().toISOString(),
      temperature_c: 28.5,
      pH: 7.8,
      do_mg_l: 5.0,
    };
    const result = WaterSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const invalid = {
      cycle_id: 'not-a-uuid',
      logged_at: new Date().toISOString(),
      temperature_c: 28.5,
      pH: 7.8,
      do_mg_l: 5.0,
    };
    const result = WaterSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const missingCycleId = {
      logged_at: new Date().toISOString(),
      temperature_c: 28.5,
      pH: 7.8,
      do_mg_l: 5.0,
    };
    expect(WaterSchema.safeParse(missingCycleId).success).toBe(false);

    const missingLoggedAt = {
      cycle_id: '123e4567-e89b-12d3-a456-426614174000',
      temperature_c: 28.5,
      pH: 7.8,
      do_mg_l: 5.0,
    };
    expect(WaterSchema.safeParse(missingLoggedAt).success).toBe(false);
  });

  it('rejects invalid date string', () => {
    const invalidDate = {
      cycle_id: '123e4567-e89b-12d3-a456-426614174000',
      logged_at: 'not-a-date',
      temperature_c: 28.5,
      pH: 7.8,
      do_mg_l: 5.0,
    };
    expect(WaterSchema.safeParse(invalidDate).success).toBe(false);
  });

  it('accepts empty string for optional numeric fields (converts to null)', () => {
    const withEmptyStrings = {
      cycle_id: '123e4567-e89b-12d3-a456-426614174000',
      logged_at: new Date().toISOString(),
      temperature_c: '',
      pH: '',
      do_mg_l: '',
      salinity_pps: '',
      ammonia_mg_l: '',
      nitrite_mg_l: '',
      alkalinity_ppms: '',
      transparency_lux: '',
    };
    const result = WaterSchema.safeParse(withEmptyStrings);
    expect(result.success).toBe(true);
    // Check that empty strings are converted to null
    if (result.success) {
      expect(result.data.temperature_c).toBeNull();
      expect(result.data.pH).toBeNull();
      expect(result.data.do_mg_l).toBeNull();
      expect(result.data.salinity_pps).toBeNull();
      expect(result.data.ammonia_mg_l).toBeNull();
      expect(result.data.nitrite_mg_l).toBeNull();
      expect(result.data.alkalinity_ppms).toBeNull();
      expect(result.data.transparency_lux).toBeNull();
    }
  });

  it('rejects non-numeric strings for numeric fields', () => {
    const invalidNumeric = {
      cycle_id: '123e4567-e89b-12d3-a456-426614174000',
      logged_at: new Date().toISOString(),
      temperature_c: 'not-a-number',
      pH: 7.8,
      do_mg_l: 5.0,
    };
    expect(WaterSchema.safeParse(invalidNumeric).success).toBe(false);
  });
});


describe('Rule evaluation', () => {
  const mockSupabase = new MockSupabase() as any as SupabaseClient;
  it('triggers RED when DO below threshold', async () => {
    const log = {
      cycle_id: '1',
      logged_at: new Date(),
      do_mg_l: 3.5,
    };
    const alerts = await evaluateRules(log as any, mockSupabase);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('RED');
    expect(alerts[0].message).toBe('Low DO');
  });

  it('triggers YELLOW when pH out of range', async () => {
    const log = {
      cycle_id: '1',
      logged_at: new Date(),
      pH: 9.0,
    };
    const alerts = await evaluateRules(log as any, mockSupabase);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('YELLOW');
    expect(alerts[0].message).toBe('pH out of range');
  });

  it('returns empty array when no thresholds are breached', async () => {
    const log = {
      cycle_id: '1',
      logged_at: new Date(),
      do_mg_l: 5.0,
      pH: 8.0,
    };
    const alerts = await evaluateRules(log as any, mockSupabase);
    expect(alerts).toHaveLength(0);
  });

  it('handles null values in log (skips rule)', async () => {
    const log = {
      cycle_id: '1',
      logged_at: new Date(),
      do_mg_l: null,
      pH: 8.0,
    };
    const alerts = await evaluateRules(log as any, mockSupabase);
    expect(alerts).toHaveLength(0);
  });
});