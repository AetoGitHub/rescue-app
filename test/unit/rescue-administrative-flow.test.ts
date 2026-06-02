import { describe, expect, it } from 'vitest';
import type { RescueAdministrativeFlowContext } from '~/interfaces/rescue/administrative';
import {
  getAdministrativeFooterActions,
  getAdministrativeRemissionAlert,
  getAdministrativeStepperCurrentIndex,
  getAdministrativeStepperSteps,
  isAdministrativeLinearStepperVisible,
  isPurchaseOrderBlockingInvoice,
  showOperativeWarningBanner,
} from '~/utils/rescue-administrative-flow';

function ctx(
  partial: Partial<RescueAdministrativeFlowContext> & {
    billing_status: RescueAdministrativeFlowContext['billing_status'];
  },
): RescueAdministrativeFlowContext {
  return {
    operative_status: 'closed',
    client_type: 'CASH',
    billing_type: 'DIRECT_INVOICE',
    requires_remision: false,
    requires_purchase_order: false,
    purchase_order_number: null,
    remittance_number: null,
    invoice_number: null,
    ...partial,
  };
}

describe('getAdministrativeStepperSteps', () => {
  it('includes remittance for credit clients', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({ billing_status: 'unattended', client_type: 'CREDIT' }),
    );
    expect(steps).toEqual([
      'unattended',
      'in_remittance',
      'invoiced',
      'paid',
    ]);
  });

  it('skips remittance for cash clients', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({ billing_status: 'unattended', client_type: 'CASH' }),
    );
    expect(steps).toEqual(['unattended', 'invoiced', 'paid']);
  });
});

describe('getAdministrativeFooterActions', () => {
  it('offers remittance when requires_remision', () => {
    const actions = getAdministrativeFooterActions(
      ctx({
        billing_status: 'unattended',
        requires_remision: true,
      }),
    );
    expect(actions.map((a) => a.id)).toContain('issue_remittance');
  });

  it('offers skip to invoiced without remision', () => {
    const actions = getAdministrativeFooterActions(
      ctx({
        billing_status: 'unattended',
        requires_remision: false,
      }),
    );
    expect(actions[0]?.id).toBe('skip_to_invoiced');
  });

  it('disables register invoice when OC missing', () => {
    const actions = getAdministrativeFooterActions(
      ctx({
        billing_status: 'in_remittance',
        requires_purchase_order: true,
        purchase_order_number: null,
      }),
    );
    expect(actions[0]?.id).toBe('register_invoice');
    expect(actions[0]?.disabled).toBe(true);
  });

  it('offers open warranty only when paid', () => {
    const actions = getAdministrativeFooterActions(
      ctx({ billing_status: 'paid' }),
    );
    expect(actions.map((a) => a.id)).toEqual(['open_warranty']);
  });
});

describe('isPurchaseOrderBlockingInvoice', () => {
  it('blocks when OC required and empty', () => {
    expect(
      isPurchaseOrderBlockingInvoice(
        ctx({
          billing_status: 'in_remittance',
          requires_purchase_order: true,
          purchase_order_number: '  ',
        }),
      ),
    ).toBe(true);
  });
});

describe('showOperativeWarningBanner', () => {
  it('warns when unattended and not closed', () => {
    expect(
      showOperativeWarningBanner(
        ctx({
          billing_status: 'unattended',
          operative_status: 'closed_unpaid',
        }),
      ),
    ).toBe(true);
  });
});

describe('getAdministrativeStepperCurrentIndex', () => {
  it('returns index for current billing status', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({ billing_status: 'unattended', client_type: 'CREDIT' }),
    );
    expect(
      getAdministrativeStepperCurrentIndex(steps, 'in_remittance'),
    ).toBe(1);
  });
});

describe('getAdministrativeRemissionAlert', () => {
  it('returns alert when unattended and remision required', () => {
    const alert = getAdministrativeRemissionAlert(
      ctx({
        billing_status: 'unattended',
        requires_remision: true,
      }),
    );
    expect(alert?.title).toBe('Requiere remisión');
  });

  it('returns null when remision not required', () => {
    expect(
      getAdministrativeRemissionAlert(
        ctx({
          billing_status: 'unattended',
          requires_remision: false,
        }),
      ),
    ).toBeNull();
  });

  it('returns alert for credit unattended from context', () => {
    const alert = getAdministrativeRemissionAlert(
      ctx({
        billing_status: 'unattended',
        client_type: 'CREDIT',
        requires_remision: true,
      }),
    );
    expect(alert?.title).toBe('Requiere remisión');
  });
});

describe('isAdministrativeLinearStepperVisible', () => {
  it('hides stepper for warranty and canceled', () => {
    expect(isAdministrativeLinearStepperVisible('warranty')).toBe(false);
    expect(isAdministrativeLinearStepperVisible('canceled')).toBe(false);
    expect(isAdministrativeLinearStepperVisible('unattended')).toBe(true);
  });
});
