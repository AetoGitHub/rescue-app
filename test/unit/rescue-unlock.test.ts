import { describe, expect, it } from 'vitest';
import { RESCUE_UNLOCK_CREATE_PATH } from '~/constants/rescue-administrative-flow';
import { createRescueUnlockFormSchema } from '~/utils/rescue-unlock-form';
import {
  coalesceUnlockUntil,
  formatRescueUnlockRemaining,
  getRescueUnlockMinDatetimeLocal,
  getRescueUnlockRemainingMs,
  isRescueUnlockActive,
  isRescueUnlockDatetimeLocalInPast,
  toDatetimeLocalInputValue,
  toRescueUnlockApiBody,
} from '~/utils/rescue-unlock';

describe('RESCUE_UNLOCK_CREATE_PATH', () => {
  it('builds unlock create path for rescue id', () => {
    expect(RESCUE_UNLOCK_CREATE_PATH(14)).toBe('/api/rescue/unlock/14/create/');
  });
});

describe('datetime local helpers', () => {
  const now = new Date('2026-06-04T15:00:00');

  it('formats datetime-local min from reference date', () => {
    expect(toDatetimeLocalInputValue(now)).toBe('2026-06-04T15:00');
    expect(getRescueUnlockMinDatetimeLocal(now)).toBe('2026-06-04T15:00');
  });

  it('detects past datetimes', () => {
    expect(isRescueUnlockDatetimeLocalInPast('2026-06-03T18:00', now)).toBe(
      true,
    );
    expect(isRescueUnlockDatetimeLocalInPast('2026-06-04T14:59', now)).toBe(
      true,
    );
    expect(isRescueUnlockDatetimeLocalInPast('2026-06-04T15:00', now)).toBe(
      false,
    );
    expect(isRescueUnlockDatetimeLocalInPast('2026-06-05T10:00', now)).toBe(
      false,
    );
  });
});

describe('createRescueUnlockFormSchema', () => {
  const now = new Date('2026-06-04T15:00:00');
  const schema = createRescueUnlockFormSchema(now);

  it('accepts valid future form state', () => {
    const parsed = schema.safeParse({
      unlocked_until_local: '2026-06-10T15:30',
      reason: 'Cliente al corriente',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects past datetimes', () => {
    const parsed = schema.safeParse({
      unlocked_until_local: '2026-06-03T18:00',
      reason: 'Motivo',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects empty fields', () => {
    expect(
      schema.safeParse({
        unlocked_until_local: '',
        reason: 'Motivo',
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        unlocked_until_local: '2026-06-10T15:30',
        reason: '',
      }).success,
    ).toBe(false);
  });
});

describe('toRescueUnlockApiBody', () => {
  const now = new Date('2026-06-04T15:00:00');

  it('converts datetime-local to ISO and trims reason', () => {
    const body = toRescueUnlockApiBody(
      {
        unlocked_until_local: '2026-06-10T15:30',
        reason: '  Cliente al corriente  ',
      },
      now,
    );

    expect(body.reason).toBe('Cliente al corriente');
    expect(body.unlocked_until).toBe(new Date('2026-06-10T15:30').toISOString());
  });

  it('throws for invalid datetime', () => {
    expect(() =>
      toRescueUnlockApiBody(
        {
          unlocked_until_local: 'invalid',
          reason: 'Motivo',
        },
        now,
      ),
    ).toThrow('Fecha de desbloqueo inválida');
  });

  it('throws for past datetime', () => {
    expect(() =>
      toRescueUnlockApiBody(
        {
          unlocked_until_local: '2026-06-03T10:00',
          reason: 'Motivo',
        },
        now,
      ),
    ).toThrow('La fecha no puede estar en el pasado');
  });
});

describe('coalesceUnlockUntil', () => {
  it('returns first non-empty value', () => {
    expect(coalesceUnlockUntil(null, '', '2026-06-10T18:00:00Z')).toBe(
      '2026-06-10T18:00:00Z',
    );
    expect(coalesceUnlockUntil('2026-06-11T10:00:00Z', '2026-06-10T18:00:00Z')).toBe(
      '2026-06-11T10:00:00Z',
    );
    expect(coalesceUnlockUntil(null, undefined, '  ')).toBe(null);
  });
});

describe('formatRescueUnlockRemaining', () => {
  const now = Date.parse('2026-06-04T15:00:00.000Z');

  it('returns 0s when expired or null', () => {
    expect(formatRescueUnlockRemaining(null, now)).toBe('0s');
    expect(formatRescueUnlockRemaining('2026-06-03T12:00:00.000Z', now)).toBe(
      '0s',
    );
  });

  it('formats seconds and minutes', () => {
    expect(
      formatRescueUnlockRemaining('2026-06-04T15:00:45.000Z', now),
    ).toBe('45s');
    expect(
      formatRescueUnlockRemaining('2026-06-04T15:02:30.000Z', now),
    ).toBe('2m 30s');
    expect(
      formatRescueUnlockRemaining('2026-06-04T16:05:00.000Z', now),
    ).toBe('1h 5m');
  });

  it('getRescueUnlockRemainingMs clamps at zero', () => {
    expect(getRescueUnlockRemainingMs('2026-06-03T12:00:00.000Z', now)).toBe(0);
    expect(getRescueUnlockRemainingMs('2026-06-04T15:01:00.000Z', now)).toBe(
      60_000,
    );
  });
});

describe('isRescueUnlockActive', () => {
  it('returns true when unlocked_until is in the future', () => {
    const now = Date.parse('2026-06-03T12:00:00.000Z');
    expect(isRescueUnlockActive('2026-06-10T12:00:00.000Z', now)).toBe(true);
  });

  it('returns false when unlocked_until is null or past', () => {
    const now = Date.parse('2026-06-10T12:00:00.000Z');
    expect(isRescueUnlockActive(null, now)).toBe(false);
    expect(isRescueUnlockActive('2026-06-03T12:00:00.000Z', now)).toBe(false);
  });
});
