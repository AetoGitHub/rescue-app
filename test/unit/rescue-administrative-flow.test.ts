import { describe, expect, it } from 'vitest';
import type { RescueAdministrativeFlowContext,
  AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import {
  getAdministrativeFooterActions,
  getAdministrativeRemissionAlert,
  getAdministrativeStepperCurrentIndex,
  getAdministrativeStepperItems,
  getAdministrativeStepperSteps,
  getValidAdminBillingTransitions,
  isAdminActionAllowed,
  isAdministrativeLinearStepperVisible,
  isAdministrativePurchaseOrderEditable,
  isKanbanAdminDocInputVisible,
  isKanbanAdminDocReadOnlyVisible,
  isKanbanAdminDocSectionVisible,
  isKanbanInvoiceFolioEditable,
  isKanbanRemittanceFolioEditable,
  isPurchaseOrderBlockingInvoice,
  isRescueAdministrativeBlocked,
  shouldShowAdministrativeInvoiceReadOnly,
  shouldShowAdministrativePurchaseOrderReadOnly,
  shouldShowKanbanInvoiceReadOnly,
  shouldShowKanbanRemittanceReadOnly,
  showOperativeWarningBanner,
} from '~/utils/rescue-administrative-flow';
import type { AdministrativeRescueDetail } from '~/interfaces/rescue/administrative';

function ctx(
  partial: Partial<RescueAdministrativeFlowContext> & {
    billing_status: RescueAdministrativeFlowContext['billing_status'];
  },
): RescueAdministrativeFlowContext {
  return {
    operative_status: 'closed',
    client_type: 'CASH',
    client_billing_type: 'DIRECT_INVOICE',
    requires_remision: false,
    requires_purchase_order: false,
    purchase_order_number: null,
    remittance_number: null,
    invoice_number: null,
    blocked: false,
    ...partial,
  };
}

function detail(
  partial: Partial<AdministrativeRescueDetail> & {
    billing_status: AdministrativeRescueDetail['billing_status'];
  },
): AdministrativeRescueDetail {
  return {
    id: 1,
    folio: 'R-1',
    service_type: 'rescue',
    client_id: 1,
    client_name: 'Acme',
    service_description: '',
    location_description: '',
    operator_id: null,
    operator_name: null,
    supplier_id: null,
    supplier_name: null,
    multiple_managers: false,
    sub_total: '1000',
    sale_price: '1000',
    net_profit: null,
    operative_status: 'closed',
    created_at: '2026-06-01T12:00:00Z',
    phase_started_at: null,
    last_comment_at: null,
    unlocked_until: null,
    service_date: null,
    seller_id: null,
    remittance_folio: null,
    invoice_folio: null,
    blocked: false,
    client_type: 'CASH',
    client_billing_type: 'DIRECT_INVOICE',
    billing_type: 'DIRECT_INVOICE',
    client_phone: null,
    seller_name: null,
    requires_purchase_order: false,
    purchase_order_number: null,
    requires_remision: false,
    remittance_number: null,
    invoice_number: null,
    invoice_date: null,
    invoice_amount: null,
    payment_amount: null,
    payment_date: null,
    payment_method: null,
    payment_reference: null,
    closed_at: null,
    admin_cancellation_reason: null,
    admin_cancellation_reason_id: null,
    provider_cost: null,
    vehicle: null,
    latitude: null,
    longitude: null,
    supplier_score: null,
    ...partial,
  };
}

function card(
  partial: Partial<AdministrativeRescueCard> & {
    billing_status: AdministrativeRescueCard['billing_status'];
  },
): AdministrativeRescueCard {
  return {
    id: 1,
    folio: 'R-1',
    service_type: 'rescue',
    client_id: 1,
    client_name: 'Acme',
    service_description: '',
    location_description: '',
    operator_id: null,
    operator_name: null,
    supplier_id: null,
    supplier_name: null,
    multiple_managers: false,
    sub_total: '1000',
    sale_price: '1000',
    net_profit: null,
    operative_status: 'closed',
    created_at: '2026-06-01T12:00:00Z',
    phase_started_at: null,
    last_comment_at: null,
    unlocked_until: null,
    service_date: null,
    seller_id: null,
    remittance_folio: null,
    invoice_folio: null,
    blocked: false,
    ...partial,
  };
}

describe('getAdministrativeStepperSteps', () => {
  it('includes remittance for MANUAL billing', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({
        billing_status: 'unattended',
        client_billing_type: 'MANUAL',
      }),
    );
    expect(steps).toEqual([
      'unattended',
      'in_remittance',
      'invoiced',
      'paid',
    ]);
  });

  it('includes remittance for REMISSION billing', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({
        billing_status: 'unattended',
        client_billing_type: 'REMISSION',
      }),
    );
    expect(steps).toHaveLength(4);
  });

  it('skips remittance for DIRECT_INVOICE billing', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({
        billing_status: 'unattended',
        client_billing_type: 'DIRECT_INVOICE',
      }),
    );
    expect(steps).toEqual(['unattended', 'invoiced', 'paid']);
  });
});

describe('getAdministrativeStepperItems', () => {
  it('maps MANUAL flow to four stepper items with kanban titles', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({ billing_status: 'unattended', client_billing_type: 'MANUAL' }),
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

  it('maps DIRECT_INVOICE flow to three stepper items without remittance', () => {
    const steps = getAdministrativeStepperSteps(
      ctx({ billing_status: 'unattended', client_billing_type: 'DIRECT_INVOICE' }),
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
  it('allows invoiced from unattended for MANUAL', () => {
    expect(
      getValidAdminBillingTransitions('MANUAL', 'unattended'),
    ).toContain('invoiced');
  });

  it('does not allow invoiced from unattended for REMISSION', () => {
    expect(
      getValidAdminBillingTransitions('REMISSION', 'unattended'),
    ).not.toContain('invoiced');
  });

  it('allows warranty from paid for MANUAL', () => {
    expect(
      getValidAdminBillingTransitions('MANUAL', 'paid'),
    ).toContain('warranty');
  });

  it('does not allow warranty from paid for PUBLIC', () => {
    expect(
      getValidAdminBillingTransitions('DIRECT_INVOICE', 'paid', 'PUBLIC'),
    ).not.toContain('warranty');
  });
});

describe('isAdminActionAllowed', () => {
  it('blocks open_warranty for public clients', () => {
    expect(
      isAdminActionAllowed(
        ctx({
          billing_status: 'paid',
          client_type: 'PUBLIC',
          client_billing_type: 'DIRECT_INVOICE',
        }),
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

  it('allows skip to invoiced for MANUAL unattended', () => {
    expect(
      isAdminActionAllowed(
        ctx({
          billing_status: 'unattended',
          client_billing_type: 'MANUAL',
          requires_remision: true,
        }),
        'skip_to_invoiced',
      ),
    ).toBe(true);
  });

  it('blocks skip to invoiced for REMISSION unattended', () => {
    expect(
      isAdminActionAllowed(
        ctx({
          billing_status: 'unattended',
          client_billing_type: 'REMISSION',
          requires_remision: true,
        }),
        'skip_to_invoiced',
      ),
    ).toBe(false);
  });
});

describe('getAdministrativeFooterActions', () => {
  it('offers remittance and skip to invoiced for MANUAL unattended', () => {
    const actions = getAdministrativeFooterActions(
      ctx({
        billing_status: 'unattended',
        client_billing_type: 'MANUAL',
        requires_remision: true,
      }),
    );
    const ids = actions.map((a) => a.id);
    expect(ids).toContain('issue_remittance');
    expect(ids).toContain('skip_to_invoiced');
  });

  it('offers only remittance for REMISSION unattended', () => {
    const actions = getAdministrativeFooterActions(
      ctx({
        billing_status: 'unattended',
        client_billing_type: 'REMISSION',
        requires_remision: true,
      }),
    );
    const ids = actions.map((a) => a.id);
    expect(ids).toContain('issue_remittance');
    expect(ids).not.toContain('skip_to_invoiced');
  });

  it('offers only skip to invoiced for DIRECT_INVOICE unattended', () => {
    const actions = getAdministrativeFooterActions(
      ctx({
        billing_status: 'unattended',
        client_billing_type: 'DIRECT_INVOICE',
        requires_remision: false,
      }),
    );
    const ids = actions.map((a) => a.id);
    expect(ids).toEqual(['skip_to_invoiced', 'admin_cancel']);
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
      ctx({
        billing_status: 'paid',
        client_type: 'CREDIT',
        client_billing_type: 'MANUAL',
      }),
    );
    expect(actions.map((a) => a.id)).toEqual(['open_warranty']);
  });

  it('offers no actions when paid for public', () => {
    const actions = getAdministrativeFooterActions(
      ctx({
        billing_status: 'paid',
        client_type: 'PUBLIC',
        client_billing_type: 'DIRECT_INVOICE',
      }),
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
      ctx({ billing_status: 'unattended', client_billing_type: 'MANUAL' }),
    );
    expect(
      getAdministrativeStepperCurrentIndex(steps, 'in_remittance'),
    ).toBe(1);
  });
});

describe('getAdministrativeRemissionAlert', () => {
  it('returns manual alert when unattended and MANUAL billing', () => {
    const alert = getAdministrativeRemissionAlert(
      ctx({
        billing_status: 'unattended',
        client_billing_type: 'MANUAL',
      }),
    );
    expect(alert?.title).toBe('Modo manual');
  });

  it('returns null for DIRECT_INVOICE unattended', () => {
    expect(
      getAdministrativeRemissionAlert(
        ctx({
          billing_status: 'unattended',
          client_billing_type: 'DIRECT_INVOICE',
        }),
      ),
    ).toBeNull();
  });

  it('returns strict remission alert for REMISSION unattended', () => {
    const alert = getAdministrativeRemissionAlert(
      ctx({
        billing_status: 'unattended',
        client_billing_type: 'REMISSION',
      }),
    );
    expect(alert?.title).toBe('Requiere remisión');
    expect(alert?.description).toContain('emitir remisión');
  });
});

describe('isAdministrativeLinearStepperVisible', () => {
  it('hides stepper for warranty and canceled', () => {
    expect(isAdministrativeLinearStepperVisible('warranty')).toBe(false);
    expect(isAdministrativeLinearStepperVisible('canceled')).toBe(false);
    expect(isAdministrativeLinearStepperVisible('unattended')).toBe(true);
  });
});

describe('purchase order and invoice visibility', () => {
  it('hides editable PO in unattended', () => {
    expect(
      isAdministrativePurchaseOrderEditable(
        ctx({
          billing_status: 'unattended',
          requires_purchase_order: true,
        }),
      ),
    ).toBe(false);
  });

  it('allows editable PO in remittance when empty', () => {
    expect(
      isAdministrativePurchaseOrderEditable(
        ctx({
          billing_status: 'in_remittance',
          requires_purchase_order: true,
          purchase_order_number: null,
        }),
      ),
    ).toBe(true);
  });

  it('locks PO after value is saved', () => {
    expect(
      isAdministrativePurchaseOrderEditable(
        ctx({
          billing_status: 'in_remittance',
          requires_purchase_order: true,
          purchase_order_number: 'OC-123',
        }),
      ),
    ).toBe(false);
    expect(
      shouldShowAdministrativePurchaseOrderReadOnly(
        ctx({
          billing_status: 'in_remittance',
          requires_purchase_order: true,
          purchase_order_number: 'OC-123',
        }),
      ),
    ).toBe(true);
  });

  it('shows read-only PO in paid when present', () => {
    expect(
      shouldShowAdministrativePurchaseOrderReadOnly(
        ctx({
          billing_status: 'paid',
          requires_purchase_order: true,
          purchase_order_number: 'OC-999',
        }),
      ),
    ).toBe(true);
  });

  it('shows read-only invoice in terminal statuses when present', () => {
    expect(
      shouldShowAdministrativeInvoiceReadOnly(
        detail({
          billing_status: 'paid',
          invoice_number: 'FAC-1',
        }),
      ),
    ).toBe(true);
    expect(
      shouldShowAdministrativeInvoiceReadOnly(
        detail({
          billing_status: 'unattended',
          invoice_number: 'FAC-1',
        }),
      ),
    ).toBe(false);
  });
});

describe('kanban admin doc visibility', () => {
  it('shows inputs in unattended when folios are empty', () => {
    const sample = card({ billing_status: 'unattended' });
    expect(isKanbanAdminDocInputVisible(sample)).toBe(true);
    expect(isKanbanRemittanceFolioEditable(sample)).toBe(true);
    expect(isKanbanInvoiceFolioEditable(sample)).toBe(true);
    expect(isKanbanAdminDocReadOnlyVisible(sample)).toBe(false);
  });

  it('hides inputs in paid even when folios are empty', () => {
    const sample = card({ billing_status: 'paid' });
    expect(isKanbanAdminDocInputVisible(sample)).toBe(false);
    expect(isKanbanAdminDocSectionVisible(sample)).toBe(false);
  });

  it('shows read-only invoice in paid when present', () => {
    const sample = card({
      billing_status: 'paid',
      invoice_folio: 'FAC-99',
    });
    expect(isKanbanAdminDocInputVisible(sample)).toBe(false);
    expect(shouldShowKanbanInvoiceReadOnly(sample)).toBe(true);
    expect(isKanbanAdminDocReadOnlyVisible(sample)).toBe(true);
    expect(isKanbanAdminDocSectionVisible(sample)).toBe(true);
  });

  it('locks saved remittance in remittance and keeps invoice editable', () => {
    const sample = card({
      billing_status: 'in_remittance',
      remittance_folio: 'REM-1',
      invoice_folio: null,
    });
    expect(shouldShowKanbanRemittanceReadOnly(sample)).toBe(true);
    expect(isKanbanRemittanceFolioEditable(sample)).toBe(false);
    expect(isKanbanInvoiceFolioEditable(sample)).toBe(true);
    expect(isKanbanAdminDocInputVisible(sample)).toBe(true);
  });

  it('hides inputs when blocked but shows read-only folios', () => {
    const sample = card({
      billing_status: 'unattended',
      remittance_folio: 'REM-1',
      invoice_folio: 'FAC-1',
      blocked: true,
    });
    expect(isKanbanAdminDocInputVisible(sample)).toBe(false);
    expect(isKanbanAdminDocReadOnlyVisible(sample)).toBe(true);
    expect(shouldShowKanbanRemittanceReadOnly(sample)).toBe(true);
    expect(shouldShowKanbanInvoiceReadOnly(sample)).toBe(true);
  });
});

describe('blocked rescue', () => {
  it('detects blocked context', () => {
    expect(isRescueAdministrativeBlocked(ctx({ billing_status: 'paid', blocked: true }))).toBe(true);
  });

  it('blocks all actions when blocked', () => {
    const blockedCtx = ctx({ billing_status: 'in_remittance', blocked: true });
    expect(isAdminActionAllowed(blockedCtx, 'register_invoice')).toBe(false);
    expect(isAdminActionAllowed(blockedCtx, 'save_purchase_order')).toBe(false);
    expect(getAdministrativeFooterActions(blockedCtx)).toEqual([]);
  });

  it('blocks PO edit when blocked even in remittance', () => {
    expect(
      isAdministrativePurchaseOrderEditable(
        ctx({
          billing_status: 'in_remittance',
          requires_purchase_order: true,
          blocked: true,
        }),
      ),
    ).toBe(false);
  });
});
