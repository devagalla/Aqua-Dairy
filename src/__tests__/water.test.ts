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
});
