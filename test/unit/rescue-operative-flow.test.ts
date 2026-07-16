import { describe, expect, it } from 'vitest';
import {
  getMoreOptionsActions,
  getRescueDetailFooterActions,
  hasRescueQuote,
  isLoanCreditExceeded,
  requiresQuoteBeforeAuthorization,
  shouldAutoSendDirectBudgetToAuthorization,
} from '~/utils/rescue-operative-flow';
import type { RescueOperativeFlowContext } from '~/interfaces/rescue/operative';

function ctx(
  partial: Partial<RescueOperativeFlowContext> & {
    operative_status: RescueOperativeFlowContext['operative_status'];
    service_type: RescueOperativeFlowContext['service_type'];
  },
): RescueOperativeFlowContext {
  return {
    quote_count: 0,
    sub_total: null,
    sale_price: null,
    advance_amount: null,
    credit_limit: null,
    credit_available: null,
    ...partial,
  };
}

describe('getRescueDetailFooterActions', () => {
  it('orders advance buttons when amount is already set', () => {
    const actions = getRescueDetailFooterActions(
      ctx({
        operative_status: 'pending_authorization',
        service_type: 'rescue',
        advance_amount: '500',
      }),
    );
    expect(actions[0]?.id).toBe('request_advance');
    expect(actions[0]?.primary).toBe(true);
    expect(actions[1]?.id).toBe('approve_without_advance');
  });

  it('puts approve without advance first when no amount', () => {
    const actions = getRescueDetailFooterActions(
      ctx({
        operative_status: 'pending_authorization',
        service_type: 'rescue',
        advance_amount: null,
      }),
    );
    expect(actions[0]?.id).toBe('approve_without_advance');
    expect(actions[1]?.id).toBe('request_advance');
  });

  it('does not put cancel_service in footer for active_without_quote', () => {
    const actions = getRescueDetailFooterActions(
      ctx({
        operative_status: 'active_without_quote',
        service_type: 'rescue',
      }),
    );
    expect(actions.map((a) => a.id)).toEqual(['send_to_authorization']);
  });

  it('offers mark_as_closed in closed_unpaid', () => {
    const actions = getRescueDetailFooterActions(
      ctx({
        operative_status: 'closed_unpaid',
        service_type: 'rescue',
      }),
    );
    expect(actions.map((a) => a.id)).toEqual(['mark_as_closed']);
  });

  it('offers revert_cancellation in canceled', () => {
    const actions = getRescueDetailFooterActions(
      ctx({
        operative_status: 'canceled',
        service_type: 'rescue',
      }),
    );
    expect(actions).toHaveLength(1);
    expect(actions[0]?.id).toBe('revert_cancellation');
    expect(actions[0]?.primary).toBe(true);
  });
});

describe('getMoreOptionsActions', () => {
  it('offers cancel_service in dropdown for active_without_quote', () => {
    const options = getMoreOptionsActions(
      ctx({
        operative_status: 'active_without_quote',
        service_type: 'rescue',
      }),
    );
    expect(options).toHaveLength(1);
    expect(options[0]?.id).toBe('cancel_service');
  });

  it('offers cancel_service in dropdown for pending_authorization', () => {
    const options = getMoreOptionsActions(
      ctx({
        operative_status: 'pending_authorization',
        service_type: 'rescue',
      }),
    );
    expect(options).toHaveLength(1);
    expect(options[0]?.id).toBe('cancel_service');
  });

  it.each([
    'requested',
    'active_without_quote',
    'pending_authorization',
    'waiting_advance_payment',
    'approved',
    'in_progress',
    'closed_unpaid',
    'warranty_pending',
  ] as const)('offers cancel_service in dropdown for %s', (status) => {
    const options = getMoreOptionsActions(
      ctx({
        operative_status: status,
        service_type: 'rescue',
      }),
    );
    expect(options).toHaveLength(1);
    expect(options[0]?.id).toBe('cancel_service');
  });

  it.each(['closed', 'canceled'] as const)(
    'does not offer cancel_service for %s',
    (status) => {
      const options = getMoreOptionsActions(
        ctx({
          operative_status: status,
          service_type: 'rescue',
        }),
      );
      expect(options).toHaveLength(0);
    },
  );
});

describe('getRescueDetailFooterActions loan', () => {
  it('disables loan approval when credit is exceeded', () => {
    const actions = getRescueDetailFooterActions(
      ctx({
        operative_status: 'pending_authorization',
        service_type: 'loan',
        credit_limit: '10000',
        credit_available: 5000,
        sale_price: '8000',
      }),
    );
    expect(actions).toHaveLength(1);
    expect(actions[0]?.disabled).toBe(true);
    expect(actions[0]?.label).toContain('crédito');
  });
});

describe('quote and direct budget rules', () => {
  it('requires quote for rescue without lines', () => {
    expect(
      requiresQuoteBeforeAuthorization(
        ctx({
          operative_status: 'active_without_quote',
          service_type: 'rescue',
          quote_count: 0,
          sub_total: null,
        }),
      ),
    ).toBe(true);
  });

  it('does not require quote for loan', () => {
    expect(
      requiresQuoteBeforeAuthorization(
        ctx({
          operative_status: 'active_without_quote',
          service_type: 'loan',
        }),
      ),
    ).toBe(false);
  });

  it('detects quote from sub_total', () => {
    expect(
      hasRescueQuote(
        ctx({
          operative_status: 'active_without_quote',
          service_type: 'rescue',
          sub_total: '1500.00',
        }),
      ),
    ).toBe(true);
  });

  it('auto-sends direct budget to authorization', () => {
    expect(
      shouldAutoSendDirectBudgetToAuthorization(
        ctx({
          operative_status: 'active_without_quote',
          service_type: 'direct_budget',
        }),
      ),
    ).toBe(true);
  });
});

describe('isLoanCreditExceeded', () => {
  it('returns false when no credit limit', () => {
    expect(
      isLoanCreditExceeded(
        ctx({
          operative_status: 'pending_authorization',
          service_type: 'loan',
          credit_limit: '0',
          sale_price: '99999',
          credit_available: 0,
        }),
      ),
    ).toBe(false);
  });
});
