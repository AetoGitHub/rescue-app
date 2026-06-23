import { describe, expect, it } from 'vitest';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import { RESCUE_OPERATIVE_TOAST } from '~/constants/rescue-operative-flow';
import {
  applyCloseSupplierGuard,
  canAssignRescueSupplier,
  hasRescueSupplierAssigned,
} from '~/utils/rescue-supplier-assign';
import { rescueSupplierAssignToBody } from '~/schemas/rescue-supplier-assign';

function minimalDetail(
  partial: Partial<RescueCardDetail> & Pick<RescueCardDetail, 'operative_status'>,
): RescueCardDetail {
  return {
    id: 1,
    folio: 'R-001',
    service_type: 'rescue',
    client_id: 10,
    client_name: 'Cliente',
    service_description: '',
    location_description: '',
    sale_price: null,
    operative_status: partial.operative_status,
    operator_id: null,
    operator_name: null,
    supplier_id: null,
    supplier_name: null,
    multiple_managers: false,
    sub_total: null,
    admin_status: 'invalid',
    created_at: '2026-01-01T00:00:00Z',
    phase_started_at: '2026-01-01T00:00:00Z',
    unlocked_until: null,
    client_type: 'CASH',
    client_phone: null,
    seller_id: null,
    seller_name: null,
    vehicle: null,
    provider_cost: null,
    net_profit: null,
    supplier_score: null,
    latitude: null,
    longitude: null,
    ...partial,
  };
}

describe('rescue supplier assign helpers', () => {
  it('hasRescueSupplierAssigned uses supplier_id', () => {
    expect(
      hasRescueSupplierAssigned(
        minimalDetail({ operative_status: 'in_progress', supplier_id: 5 }),
      ),
    ).toBe(true);
    expect(
      hasRescueSupplierAssigned(
        minimalDetail({
          operative_status: 'in_progress',
          supplier_id: null,
          supplier_name: 'Fantasma',
        }),
      ),
    ).toBe(false);
  });

  it('canAssignRescueSupplier allows active statuses', () => {
    expect(
      canAssignRescueSupplier(
        minimalDetail({ operative_status: 'in_progress' }),
      ),
    ).toBe(true);
  });

  it('canAssignRescueSupplier blocks terminal statuses', () => {
    for (const status of ['closed', 'closed_unpaid', 'canceled'] as const) {
      expect(
        canAssignRescueSupplier(minimalDetail({ operative_status: status })),
      ).toBe(false);
    }
  });

  it('applyCloseSupplierGuard disables close actions without supplier', () => {
    const actions = applyCloseSupplierGuard(
      [
        { id: 'complete_service', label: 'Cerrar', primary: true },
        { id: 'take_request', label: 'Tomar', primary: false },
      ],
      minimalDetail({ operative_status: 'in_progress' }),
    );

    expect(actions[0]?.disabled).toBe(true);
    expect(actions[0]?.disabledReason).toBe(
      RESCUE_OPERATIVE_TOAST.supplierRequiredBeforeClose,
    );
    expect(actions[1]?.disabled).toBeUndefined();
  });

  it('applyCloseSupplierGuard leaves actions enabled with supplier', () => {
    const actions = applyCloseSupplierGuard(
      [{ id: 'complete_service', label: 'Cerrar', primary: true }],
      minimalDetail({
        operative_status: 'in_progress',
        supplier_id: 3,
      }),
    );

    expect(actions[0]?.disabled).toBeUndefined();
  });

  it('rescueSupplierAssignToBody maps supplier id', () => {
    expect(rescueSupplierAssignToBody({ supplier: 5 })).toEqual({
      supplier: 5,
    });
  });
});
