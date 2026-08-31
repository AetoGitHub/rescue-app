import { describe, expect, it } from 'vitest';
import {
  daysSemaphoreColor,
  formatDashboardSummarySinIva,
  formatMatrixMonthLabel,
  formatPendingInvoiceMoney,
  matrixCellAgeClass,
  monthsBehindCurrent,
  needsAttention,
  pendingInvoiceRowAgeClass,
} from '../../app/utils/pending-invoice-display';

describe('pending-invoice-display', () => {
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

  describe('pendingInvoiceRowAgeClass', () => {
    it('maps each semaphore band to a distinct row tint', () => {
      const tints = [
        pendingInvoiceRowAgeClass(10),
        pendingInvoiceRowAgeClass(45),
        pendingInvoiceRowAgeClass(120),
      ];
      expect(new Set(tints).size).toBe(3);
      expect(tints[0]).toContain('success');
      expect(tints[1]).toContain('warning');
      expect(tints[2]).toContain('error');
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

  describe('formatMatrixMonthLabel', () => {
    it('renders month and year', () => {
      expect(formatMatrixMonthLabel('2026-02')).toMatch(/2026$/);
      expect(formatMatrixMonthLabel('2026-02')).toMatch(/^[A-Z]/);
    });

    it('returns the key when it cannot be parsed', () => {
      expect(formatMatrixMonthLabel('nope')).toBe('nope');
    });
  });

  describe('needsAttention', () => {
    it('flags remission without purchase order', () => {
      expect(needsAttention({ status: 'En remisión', oc: null })).toBe(true);
      expect(needsAttention({ status: 'En remisión', oc: '–' })).toBe(true);
    });

    it('does not flag when OC exists or status differs', () => {
      expect(needsAttention({ status: 'En remisión', oc: 'OC-123' })).toBe(false);
      expect(needsAttention({ status: 'Sin atender', oc: null })).toBe(false);
    });
  });

  describe('formatDashboardSummarySinIva', () => {
    it('labels the backend sub_total as Total sin IVA', () => {
      expect(formatDashboardSummarySinIva(1500)).toBe(
        `Total sin IVA ${formatPendingInvoiceMoney(1500)}`,
      );
    });
  });
});
