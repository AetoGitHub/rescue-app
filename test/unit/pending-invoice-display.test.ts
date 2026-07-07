import { describe, expect, it } from 'vitest';
import {
  computeSparklineTrend,
  daysSemaphoreColor,
  matrixCellAgeClass,
  monthsBehindCurrent,
  needsAttention,
} from '../../app/utils/pending-invoice-display';

describe('pending-invoice-display', () => {
  describe('computeSparklineTrend', () => {
    it('returns flat when fewer than two points', () => {
      expect(computeSparklineTrend([])).toEqual({
        percentChange: null,
        direction: 'flat',
      });
      expect(computeSparklineTrend([{ fecha: '2026-01-01', valor: 100 }])).toEqual({
        percentChange: null,
        direction: 'flat',
      });
    });

    it('detects downward trend', () => {
      const trend = computeSparklineTrend([
        { fecha: '2026-01-01', valor: 100 },
        { fecha: '2026-01-02', valor: 80 },
      ]);
      expect(trend.direction).toBe('down');
      expect(trend.percentChange).toBe(-20);
    });

    it('detects upward trend', () => {
      const trend = computeSparklineTrend([
        { fecha: '2026-01-01', valor: 100 },
        { fecha: '2026-01-02', valor: 125 },
      ]);
      expect(trend.direction).toBe('up');
      expect(trend.percentChange).toBe(25);
    });

    it('handles zero baseline with growth', () => {
      const trend = computeSparklineTrend([
        { fecha: '2026-01-01', valor: 0 },
        { fecha: '2026-01-02', valor: 50 },
      ]);
      expect(trend.direction).toBe('up');
      expect(trend.percentChange).toBe(100);
    });
  });

  describe('daysSemaphoreColor', () => {
    it('uses success below 30 days', () => {
      expect(daysSemaphoreColor(29)).toBe('success');
    });

    it('uses warning between 30 and 60 days', () => {
      expect(daysSemaphoreColor(30)).toBe('warning');
      expect(daysSemaphoreColor(60)).toBe('warning');
    });

    it('uses error above 60 days', () => {
      expect(daysSemaphoreColor(61)).toBe('error');
    });
  });

  describe('matrixCellAgeClass', () => {
    const now = new Date(2026, 6, 7);

    it('has no class for current month', () => {
      expect(matrixCellAgeClass('2026-07', now)).toBe('');
    });

    it('uses warning for one month behind', () => {
      expect(matrixCellAgeClass('2026-06', now)).toBe('bg-warning/10');
    });

    it('uses error for two or more months behind', () => {
      expect(matrixCellAgeClass('2026-05', now)).toBe('bg-error/10');
      expect(matrixCellAgeClass('2025-12', now)).toBe('bg-error/10');
    });
  });

  describe('monthsBehindCurrent', () => {
    it('computes month difference', () => {
      const now = new Date(2026, 6, 7);
      expect(monthsBehindCurrent('2026-07', now)).toBe(0);
      expect(monthsBehindCurrent('2026-06', now)).toBe(1);
      expect(monthsBehindCurrent('2026-04', now)).toBe(3);
    });
  });

  describe('needsAttention', () => {
    it('flags remission without purchase order', () => {
      expect(
        needsAttention({ status: 'En remisión', oc: null }),
      ).toBe(true);
      expect(
        needsAttention({ status: 'En remisión', oc: '–' }),
      ).toBe(true);
    });

    it('does not flag when OC exists or status differs', () => {
      expect(
        needsAttention({ status: 'En remisión', oc: 'OC-123' }),
      ).toBe(false);
      expect(
        needsAttention({ status: 'Sin atender', oc: null }),
      ).toBe(false);
    });
  });
});
