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
