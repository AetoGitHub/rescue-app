import { describe, expect, it } from 'vitest';
import type { SupplierServiceType } from '../../app/interfaces/catalogs/supplier';
import type { RescueSupplierNearbyRow } from '../../app/interfaces/rescue';
import { supplierCreateToCreateBody } from '../../app/schemas/catalog-create';

describe('supplierCreateToCreateBody', () => {
  const baseInput = {
    name: 'Proveedor Test',
    description: '',
    phone: '8112345678',
    email: 'test@example.com',
    service_type: ['cranes'] as SupplierServiceType[],
    is_trusted: false,
    notes: '',
    latitude: '',
    longitude: '',
  };

  it('omits is_trusted when checkbox is unchecked', () => {
    const body = supplierCreateToCreateBody(baseInput);
    expect(body).not.toHaveProperty('is_trusted');
    expect(body.name).toBe('Proveedor Test');
  });

  it('includes is_trusted when checkbox is checked', () => {
    const body = supplierCreateToCreateBody({
      ...baseInput,
      is_trusted: true,
    });
    expect(body.is_trusted).toBe(true);
  });
});
