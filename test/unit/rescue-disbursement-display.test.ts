import { describe, expect, it } from 'vitest';
import {
  formatDisbursementDate,
  getRescueAdvanceStatusColor,
  getRescueAdvanceStatusKind,
  getRescueAdvanceStatusLabel,
  hasRescueAdvanceSummary,
} from '../../app/utils/rescue-disbursement-display';

describe('getRescueAdvanceStatusKind', () => {
  it('returns not_requested when advance was never asked', () => {
    expect(
      getRescueAdvanceStatusKind({
        advance_requested: false,
        advance_received: null,
      }),
    ).toBe('not_requested');
  });

  it('returns pending when requested but not received', () => {
    expect(
      getRescueAdvanceStatusKind({
        advance_requested: true,
        advance_received: false,
      }),
    ).toBe('pending');
  });

  it('returns received when requested and confirmed', () => {
    expect(
      getRescueAdvanceStatusKind({
        advance_requested: true,
        advance_received: true,
      }),
    ).toBe('received');
  });
});

describe('hasRescueAdvanceSummary', () => {
  it('is true only when advance was requested', () => {
    expect(hasRescueAdvanceSummary({ advance_requested: true })).toBe(true);
    expect(hasRescueAdvanceSummary({ advance_requested: false })).toBe(false);
    expect(hasRescueAdvanceSummary({})).toBe(false);
  });
});

describe('getRescueAdvanceStatusLabel / color', () => {
  it('maps kinds to Spanish labels and badge colors', () => {
    expect(getRescueAdvanceStatusLabel('not_requested')).toBe('No solicitado');
    expect(getRescueAdvanceStatusLabel('pending')).toBe('Pendiente');
    expect(getRescueAdvanceStatusLabel('received')).toBe('Pagado');
    expect(getRescueAdvanceStatusColor('not_requested')).toBe('neutral');
    expect(getRescueAdvanceStatusColor('pending')).toBe('warning');
    expect(getRescueAdvanceStatusColor('received')).toBe('success');
  });
});

describe('formatDisbursementDate', () => {
  it('formats YYYY-MM-DD without UTC day shift', () => {
    expect(formatDisbursementDate('2026-07-22')).toMatch(/22/);
  });

  it('returns placeholder for empty values', () => {
    expect(formatDisbursementDate(null)).toBe('—');
    expect(formatDisbursementDate('')).toBe('—');
  });
});
