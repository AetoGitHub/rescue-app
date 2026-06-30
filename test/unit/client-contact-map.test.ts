import { describe, expect, it } from 'vitest';
import {
  clientContactFormToCreateBody,
  clientContactFormToUpdateBody,
  mapClientContactDetail,
  mapClientContactRow,
  mapClientCsfUrl,
} from '../../app/utils/client-contact-map';

describe('mapClientContactRow', () => {
  it('maps list row fields', () => {
    const row = mapClientContactRow({
      id: 1,
      client_id: 10,
      name: 'Juan Pérez',
      position: 'Gerente',
      email: 'juan@cliente.mx',
      phone: '5512345678',
      whatsapp: '5512345678',
      is_authorizer: true,
      receives_quotes: true,
      receives_oc_reminders: false,
      receives_account_status: false,
      is_billing_contact: false,
      is_active: true,
    });

    expect(row).toMatchObject({
      id: 1,
      client_id: 10,
      name: 'Juan Pérez',
      is_authorizer: true,
      is_active: true,
    });
  });
});

describe('mapClientContactDetail', () => {
  it('maps detail to form state', () => {
    const form = mapClientContactDetail({
      name: 'juan pérez',
      position: 'Director',
      email: 'juan@cliente.mx',
      phone: '5512345678',
      whatsapp: '5587654321',
      is_authorizer: false,
      receives_quotes: true,
      receives_oc_reminders: true,
      receives_account_status: false,
      is_billing_contact: true,
      is_active: false,
    });

    expect(form.name).toBe('JUAN PÉREZ');
    expect(form.phone).toBe('55 1234 5678');
    expect(form.is_active).toBe(false);
  });
});

describe('client contact body mappers', () => {
  const form = {
    name: 'JUAN PÉREZ',
    position: 'Gerente',
    email: 'juan@cliente.mx',
    phone: '55 1234 5678',
    whatsapp: '55 1234 5678',
    is_authorizer: true,
    receives_quotes: true,
    receives_oc_reminders: false,
    receives_account_status: false,
    is_billing_contact: false,
    is_active: true,
  };

  it('builds create body with client id', () => {
    expect(clientContactFormToCreateBody(5, form)).toEqual({
      client: 5,
      name: 'JUAN PÉREZ',
      position: 'Gerente',
      email: 'juan@cliente.mx',
      phone: '55 1234 5678',
      whatsapp: '55 1234 5678',
      is_authorizer: true,
      receives_quotes: true,
      receives_oc_reminders: false,
      receives_account_status: false,
      is_billing_contact: false,
    });
  });

  it('builds update body with is_active', () => {
    expect(clientContactFormToUpdateBody(5, form)).toEqual({
      client: 5,
      name: 'JUAN PÉREZ',
      position: 'Gerente',
      email: 'juan@cliente.mx',
      phone: '55 1234 5678',
      whatsapp: '55 1234 5678',
      is_authorizer: true,
      receives_quotes: true,
      receives_oc_reminders: false,
      receives_account_status: false,
      is_billing_contact: false,
      is_active: true,
    });
  });
});

describe('mapClientCsfUrl', () => {
  it('returns trimmed url or null', () => {
    expect(mapClientCsfUrl({ csf: ' https://example.com/csf.pdf ' })).toBe(
      'https://example.com/csf.pdf',
    );
    expect(mapClientCsfUrl({ csf: '' })).toBeNull();
    expect(mapClientCsfUrl({})).toBeNull();
  });
});
