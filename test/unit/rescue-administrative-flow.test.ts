import { describe, expect, it } from 'vitest';
import type { RescueAdministrativeFlowContext } from '~/interfaces/rescue/administrative';
import {
  getAdministrativeFooterActions,
  getAdministrativeRemissionAlert,
  getAdministrativeStepperCurrentIndex,
  getAdministrativeStepperItems,
  getAdministrativeStepperSteps,
  getValidAdminBillingTransitions,
  isAdminActionAllowed,
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

describe('getAdministrativeStepperItems', () => {
  it('maps credit flow to four stepper items with kanban titles', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({ billing_status: 'unattended', client_type: 'CREDIT' }),
    );
    const items = getAdministrativeStepperItems(steps);
    expect(items).toHaveLength(4);
    expect(items.map((item) => item.title)).toEqual([
      'Sin atender',
      'En remisión',
      'Facturado',
      'Pagado',
    ]);
    expect(items.map((item) => item.value)).toEqual([0, 1, 2, 3]);
    expect(items[0]?.icon).toBe('i-lucide-inbox');
  });

  it('maps cash flow to three stepper items without remittance', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({ billing_status: 'unattended', client_type: 'CASH' }),
    );
    const items = getAdministrativeStepperItems(steps);
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.title)).toEqual([
      'Sin atender',
      'Facturado',
      'Pagado',
    ]);
  });
});

describe('getValidAdminBillingTransitions', () => {
  it('allows invoiced from unattended for credit', () => {
    expect(
      getValidAdminBillingTransitions('CREDIT', 'unattended'),
    ).toContain('invoiced');
  });

  it('allows warranty from paid for credit', () => {
    expect(
      getValidAdminBillingTransitions('CREDIT', 'paid'),
    ).toContain('warranty');
  });

  it('does not allow warranty from paid for public', () => {
    expect(
      getValidAdminBillingTransitions('PUBLIC', 'paid'),
    ).not.toContain('warranty');
  });
});

describe('isAdminActionAllowed', () => {
  it('blocks open_warranty for public clients', () => {
    expect(
      isAdminActionAllowed(
        ctx({ billing_status: 'paid', client_type: 'PUBLIC' }),
        'open_warranty',
      ),
    ).toBe(false);
  });

  it('blocks admin_cancel from paid for credit', () => {
    expect(
      isAdminActionAllowed(
        ctx({ billing_status: 'paid', client_type: 'CREDIT' }),
        'admin_cancel',
      ),
    ).toBe(false);
  });

  it('allows revert from canceled', () => {
    expect(
      isAdminActionAllowed(
        ctx({ billing_status: 'canceled', client_type: 'CREDIT' }),
        'revert_admin_cancellation',
      ),
    ).toBe(true);
  });

  it('allows skip to invoiced when remision required for credit', () => {
    expect(
      isAdminActionAllowed(
        ctx({
          billing_status: 'unattended',
          client_type: 'CREDIT',
          requires_remision: true,
        }),
        'skip_to_invoiced',
      ),
    ).toBe(true);
  });
});

describe('getAdministrativeFooterActions', () => {
  it('offers remittance and skip to invoiced when requires_remision', () => {
    const actions = getAdministrativeFooterActions(
      ctx({
        billing_status: 'unattended',
        client_type: 'CREDIT',
        requires_remision: true,
      }),
    );
    const ids = actions.map((a) => a.id);
    expect(ids).toContain('issue_remittance');
    expect(ids).toContain('skip_to_invoiced');
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

  it('offers open warranty only when paid for credit', () => {
    const actions = getAdministrativeFooterActions(
      ctx({ billing_status: 'paid', client_type: 'CREDIT' }),
    );
    expect(actions.map((a) => a.id)).toEqual(['open_warranty']);
  });

  it('offers no actions when paid for public', () => {
    const actions = getAdministrativeFooterActions(
      ctx({ billing_status: 'paid', client_type: 'PUBLIC' }),
    );
    expect(actions).toEqual([]);
  });

  it('offers revert when canceled', () => {
    const actions = getAdministrativeFooterActions(
      ctx({ billing_status: 'canceled', client_type: 'CREDIT' }),
    );
    expect(actions.map((a) => a.id)).toEqual(['revert_admin_cancellation']);
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
