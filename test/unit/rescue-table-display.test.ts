import { describe, expect, it } from 'vitest';
import { getBillingStatusBadge } from '~/utils/administrative-rescue-display';
import { getAdminStatusBadge } from '~/utils/operational-rescue-detail';
import {
  getRescueTableServiceTypeBadgeProps,
  getRescueTableSupplierBadgeProps,
} from '~/utils/rescue-table-display';

describe('getBillingStatusBadge', () => {
  it('translates unattended to Sin atender', () => {
    expect(getBillingStatusBadge('unattended')).toEqual({
      label: 'Sin atender',
      color: 'neutral',
    });
  });
});

describe('getRescueTableSupplierBadgeProps', () => {
  it('returns error chip when supplier is missing', () => {
    expect(getRescueTableSupplierBadgeProps(null)).toEqual({
      label: 'Sin proveedor',
      color: 'error',
      icon: 'i-lucide-truck',
    });
    expect(getRescueTableSupplierBadgeProps('   ')).toEqual({
      label: 'Sin proveedor',
      color: 'error',
      icon: 'i-lucide-truck',
    });
  });

  it('returns neutral chip with supplier name', () => {
    expect(getRescueTableSupplierBadgeProps('REMOLQUES EL MENO')).toEqual({
      label: 'REMOLQUES EL MENO',
      color: 'neutral',
      icon: 'i-lucide-truck',
    });
  });
});

describe('getRescueTableServiceTypeBadgeProps', () => {
  it('includes icon from rescue service type options', () => {
    const badge = getRescueTableServiceTypeBadgeProps('rescue');
    expect(badge.label).toBe('RESCATE');
    expect(badge.icon).toBe('i-lucide-truck');
    expect(badge.color).toBe('info');
  });
});

describe('getAdminStatusBadge', () => {
  it('keeps gestor labels for agent statuses', () => {
    expect(getAdminStatusBadge('working')).toEqual({
      label: 'Trabajando',
      color: 'info',
    });
  });

  it('falls back to billing labels for billing slugs', () => {
    expect(getAdminStatusBadge('unattended')).toEqual({
      label: 'Sin atender',
      color: 'neutral',
    });
    expect(getAdminStatusBadge('paid')).toEqual({
      label: 'Pagado',
      color: 'success',
    });
  });
});
