import { describe, expect, it } from 'vitest';
import type { CompanyCreateBody } from '../../app/interfaces/catalogs/company';
import { applyCompanyDetailToClientDraft } from '../../app/utils/catalog-detail-map';

describe('applyCompanyDetailToClientDraft', () => {
  it('copies company fields except name', () => {
    const company: CompanyCreateBody = {
      name: 'COMPAÑÍA SA',
      business_name: 'Compañía Razón',
      rfc: 'ABC123456XYZ',
      phone: '5511223344',
      email: 'co@example.com',
      address: 'Calle 1',
      client_type: 'CREDIT',
      billing_type: 'MANUAL',
      commission_type: 'FIXED',
      commission_value: '10.00',
      commission_fixed: '100.00',
      price_multiplier: '1.25',
      loan_multiplier: '1.50',
    };

    const draft = {
      name: 'Cliente independiente',
      business_name: '',
      rfc: '',
      phone: '',
      email: '',
      address: '',
      client_type: 'CASH',
      billing_type: 'DIRECT_INVOICE',
      commission_type: 'PERCENTAGE',
      commission_value: '0.00',
      commission_fixed: '0.00',
      price_multiplier: '1.00',
      loan_multiplier: '1.00',
    };

    applyCompanyDetailToClientDraft(draft, company);

    expect(draft.name).toBe('Cliente independiente');
    expect(draft.business_name).toBe('Compañía Razón');
    expect(draft.rfc).toBe('ABC123456XYZ');
    expect(draft.client_type).toBe('CREDIT');
    expect(draft.price_multiplier).toBe('1.25');
    expect(draft.loan_multiplier).toBe('1.50');
  });
});
