import { describe, expect, it } from 'vitest';
import { toOperativeUpdatePayload } from '~/utils/rescue-operative-api-map';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';

function minimalDetail(
  partial: Partial<RescueCardDetail> = {},
): RescueCardDetail {
  return {
    id: 1,
    folio: 'R-001',
    client_id: 1,
    client_name: 'Cliente',
    service_type: 'rescue',
    operative_status: 'active_without_quote',
    admin_status: 'normal',
    ...partial,
  } as RescueCardDetail;
}

describe('toOperativeUpdatePayload cancel_service', () => {
  it('sends cancellation_reason id instead of free text', () => {
    const payload = toOperativeUpdatePayload('cancel_service', minimalDetail(), {
      cancellationReasonId: 42,
    });

    expect(payload).toEqual({
      to: 'canceled',
      cancellation_reason: 42,
    });
    expect(payload).not.toHaveProperty('cancel_reason');
  });
});

describe('toOperativeUpdatePayload close actions', () => {
  const completedForm = {
    close_date: '2026-06-26',
    disbursement_date: '2026-06-26',
    disbursement_payment_method: 'transfer' as const,
    ratings: [
      {
        supplier_id: 10,
        supplier_name: 'Proveedor A',
        score: 5,
        comment: 'Excelente',
      },
    ],
  };

  it('complete_service sends close fields without supplier_ratings', () => {
    const payload = toOperativeUpdatePayload('complete_service', minimalDetail(), {
      completed: completedForm,
    });

    expect(payload).toEqual({
      to: 'closed_unpaid',
      close_date: '2026-06-26',
      disbursement_date: '2026-06-26',
      disbursement_payment_method: 'transfer',
    });
    expect(payload).not.toHaveProperty('supplier_ratings');
  });

  it('confirm_disbursement sends close fields without supplier_ratings', () => {
    const payload = toOperativeUpdatePayload(
      'confirm_disbursement',
      minimalDetail({ service_type: 'loan' }),
      { completed: completedForm },
    );

    expect(payload).toEqual({
      to: 'closed_unpaid',
      close_date: '2026-06-26',
      disbursement_date: '2026-06-26',
      disbursement_payment_method: 'transfer',
    });
    expect(payload).not.toHaveProperty('supplier_ratings');
  });
});
