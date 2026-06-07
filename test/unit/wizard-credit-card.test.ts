import { describe, expect, it } from 'vitest';
import {
  isWizardCreditClient,
  normalizeClientType,
  shouldShowWizardCreditCard,
} from '~/utils/client-list-display';
import type { ClientCreditSnapshot } from '~/schemas/rescue-create';

describe('normalizeClientType', () => {
  it('normalizes string values', () => {
    expect(normalizeClientType('credit')).toBe('CREDIT');
    expect(normalizeClientType(' CASH ')).toBe('CASH');
  });

  it('reads value from select-like objects', () => {
    expect(normalizeClientType({ value: 'CREDIT' })).toBe('CREDIT');
  });
});

describe('shouldShowWizardCreditCard', () => {
  const creditSnapshot: ClientCreditSnapshot = {
    client_type: 'CREDIT',
    credit_limit: '10000.00',
    credit_available: 3000,
  };

  it('hides when no client is selected', () => {
    expect(shouldShowWizardCreditCard(undefined, null)).toBe(false);
  });

  it('shows loading state while snapshot is pending', () => {
    expect(shouldShowWizardCreditCard(5, null)).toBe(true);
  });

  it('shows for explicit credit clients', () => {
    expect(shouldShowWizardCreditCard(5, creditSnapshot)).toBe(true);
  });

  it('shows when credit metrics exist even if type is not CREDIT', () => {
    expect(
      shouldShowWizardCreditCard(5, {
        ...creditSnapshot,
        client_type: 'CASH',
      }),
    ).toBe(true);
  });

  it('hides for cash clients without credit metrics', () => {
    expect(
      shouldShowWizardCreditCard(5, {
        client_type: 'CASH',
        credit_limit: null,
        credit_available: null,
      }),
    ).toBe(false);
  });
});

describe('isWizardCreditClient', () => {
  it('detects credit by type or available balance', () => {
    expect(
      isWizardCreditClient({
        client_type: 'credit',
        credit_limit: null,
        credit_available: null,
      }),
    ).toBe(true);
    expect(
      isWizardCreditClient({
        client_type: 'CASH',
        credit_limit: null,
        credit_available: -1000,
      }),
    ).toBe(true);
  });
});
