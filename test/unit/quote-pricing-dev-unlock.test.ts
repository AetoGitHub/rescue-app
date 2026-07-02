import { describe, expect, it } from 'vitest';
import {
  canToggleQuotePricingDevUnlock,
  isQuoteDevUnlockShortcut,
  quotePricingDevBreakdownMode,
  readQuoteDevUnlockFromStorage,
  shouldShowQuotePricingDevBreakdown,
} from '../../app/utils/quote-pricing-dev-unlock';

describe('readQuoteDevUnlockFromStorage', () => {
  it('returns true only for stored flag 1', () => {
    expect(readQuoteDevUnlockFromStorage('1')).toBe(true);
    expect(readQuoteDevUnlockFromStorage('0')).toBe(false);
    expect(readQuoteDevUnlockFromStorage(null)).toBe(false);
  });
});

describe('shouldShowQuotePricingDevBreakdown', () => {
  it('always shows in dev', () => {
    expect(
      shouldShowQuotePricingDevBreakdown({
        dev: true,
        unlocked: false,
        isAdmin: false,
      }),
    ).toBe(true);
  });

  it('shows in prod only when unlocked and admin', () => {
    expect(
      shouldShowQuotePricingDevBreakdown({
        dev: false,
        unlocked: true,
        isAdmin: true,
      }),
    ).toBe(true);
    expect(
      shouldShowQuotePricingDevBreakdown({
        dev: false,
        unlocked: true,
        isAdmin: false,
      }),
    ).toBe(false);
    expect(
      shouldShowQuotePricingDevBreakdown({
        dev: false,
        unlocked: false,
        isAdmin: true,
      }),
    ).toBe(false);
  });
});

describe('canToggleQuotePricingDevUnlock', () => {
  it('allows toggle in dev or for admin', () => {
    expect(
      canToggleQuotePricingDevUnlock({ dev: true, isAdmin: false }),
    ).toBe(true);
    expect(
      canToggleQuotePricingDevUnlock({ dev: false, isAdmin: true }),
    ).toBe(true);
    expect(
      canToggleQuotePricingDevUnlock({ dev: false, isAdmin: false }),
    ).toBe(false);
  });
});

describe('isQuoteDevUnlockShortcut', () => {
  it('matches Ctrl+Shift+Q', () => {
    expect(
      isQuoteDevUnlockShortcut({
        ctrlKey: true,
        shiftKey: true,
        key: 'Q',
      }),
    ).toBe(true);
    expect(
      isQuoteDevUnlockShortcut({
        ctrlKey: true,
        shiftKey: true,
        key: 'q',
      }),
    ).toBe(true);
  });

  it('rejects other combinations', () => {
    expect(
      isQuoteDevUnlockShortcut({
        ctrlKey: true,
        shiftKey: false,
        key: 'q',
      }),
    ).toBe(false);
    expect(
      isQuoteDevUnlockShortcut({
        ctrlKey: false,
        shiftKey: true,
        key: 'q',
      }),
    ).toBe(false);
    expect(
      isQuoteDevUnlockShortcut({
        ctrlKey: true,
        shiftKey: true,
        key: 'd',
      }),
    ).toBe(false);
  });
});

describe('quotePricingDevBreakdownMode', () => {
  it('returns null when hidden', () => {
    expect(
      quotePricingDevBreakdownMode({
        dev: false,
        unlocked: false,
        isAdmin: true,
      }),
    ).toBeNull();
  });

  it('returns dev or admin mode when visible', () => {
    expect(
      quotePricingDevBreakdownMode({
        dev: true,
        unlocked: false,
        isAdmin: false,
      }),
    ).toBe('dev');
    expect(
      quotePricingDevBreakdownMode({
        dev: false,
        unlocked: true,
        isAdmin: true,
      }),
    ).toBe('admin');
  });
});
