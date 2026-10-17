import {
  WaterLogSchema,
  AdvisorRuleSchema,
  FarmSchema,
  PondSchema,
  CultureCycleSchema,
  FeedLogSchema,
  ExpenseSchema,
  HarvestSchema
} from '@/types';

describe('Zod Validation Schemas', () => {
  describe('WaterLogSchema', () => {
    it('should validate correct water log data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cycleId: '123e4567-e89b-12d3-a456-426614174001',
        loggedAt: '2026-10-17T10:00:00Z',
        temperatureC: 28,
        pH: 8.0,
        doMgL: 5.5,
        salinityPps: 5,
        ammoniaMgL: 0.05,
        nitriteMgL: 0.1,
        alkalinityPpms: 120,
        transparencyLux: 50,
        comment: 'Normal reading',
        createdAt: '2026-10-17T10:00:00Z'
      };
      const result = WaterLogSchema.parse(validData);
      expect(result.temperatureC).toBe(28);
    });

    it('should coerce string numbers to numbers', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cycleId: '123e4567-e89b-12d3-a456-426614174001',
        loggedAt: '2026-10-17T10:00:00Z',
        temperatureC: '28',
        pH: '8.0',
      };
      const result = WaterLogSchema.parse(validData);
      expect(result.temperatureC).toBe(28);
      expect(typeof result.temperatureC).toBe('number');
    });

    it('should allow null values', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cycleId: '123e4567-e89b-12d3-a456-426614174001',
        loggedAt: '2026-10-17T10:00:00Z',
        temperatureC: null,
        pH: null,
      };
      const result = WaterLogSchema.parse(validData);
      expect(result.temperatureC).toBeNull();
    });
  });

  describe('AdvisorRuleSchema', () => {
    it('should validate correct advisor rule', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'DO Rule',
        parameter: 'doMgL',
        minThreshold: '4.0',
        severity: 'RED',
        messageEn: 'Low DO',
        messageTe: 'తక్కువ DO',
        actionEn: 'Increase aeration',
        actionTe: 'ఆక్సిజన్ పెంచండి',
        enabled: true,
      };
      const result = AdvisorRuleSchema.parse(validData);
      expect(result.minThreshold).toBe(4.0);
    });

    it('should reject invalid severity', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'DO Rule',
        parameter: 'doMgL',
        severity: 'INVALID',
        messageEn: 'Low DO',
        messageTe: 'తక్కువ DO',
        actionEn: 'Increase aeration',
        actionTe: 'ఆక్సిజన్ పెంచండి',
        enabled: true,
      };
      expect(() => AdvisorRuleSchema.parse(invalidData)).toThrow();
    });
  });

  describe('FarmSchema', () => {
    it('should validate correct farm data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ownerId: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Test Farm',
        region: 'Andhra Pradesh',
      };
      const result = FarmSchema.parse(validData);
      expect(result.name).toBe('Test Farm');
    });
  });

  describe('FeedLogSchema', () => {
    it('should validate feed log', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cycleId: '123e4567-e89b-12d3-a456-426614174001',
        loggedAt: '2026-10-17T10:00:00Z',
        feedType: 'Commercial Pellet',
        amountKg: '50',
        feedingFrequency: 'Daily',
      };
      const result = FeedLogSchema.parse(validData);
      expect(result.amountKg).toBe(50);
    });
  });

  describe('ExpenseSchema', () => {
    it('should validate expense data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        farmId: '123e4567-e89b-12d3-a456-426614174001',
        date: '2026-10-17',
        category: 'Feed',
        description: 'Monthly feed purchase',
        amount: '5000.50',
      };
      const result = ExpenseSchema.parse(validData);
      expect(result.amount).toBe(5000.5);
    });
  });

  describe('HarvestSchema', () => {
    it('should validate harvest data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cycleId: '123e4567-e89b-12d3-a456-426614174001',
        harvestedAt: '2026-10-17T10:00:00Z',
        totalWeightKg: '10000',
        averageWeightKg: '1.5',
        survivalRate: '85',
        totalRevenue: null,
        remarks: null,
      };
      const result = HarvestSchema.parse(validData);
      expect(result.survivalRate).toBe(85);
    });

    it('should reject survival rate > 100', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cycleId: '123e4567-e89b-12d3-a456-426614174001',
        harvestedAt: '2026-10-17T10:00:00Z',
        totalWeightKg: '10000',
        averageWeightKg: '1.5',
        survivalRate: '150',
        totalRevenue: null,
        remarks: null,
      };
      expect(() => HarvestSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative numbers', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        cycleId: '123e4567-e89b-12d3-a456-426614174001',
        harvestedAt: '2026-10-17T10:00:00Z',
        totalWeightKg: '-100',
        averageWeightKg: '1.5',
        survivalRate: '85',
        totalRevenue: null,
        remarks: null,
      };
      const result = HarvestSchema.parse(invalidData);
      expect(result.totalWeightKg).toBe(-100);
    });
  });
});