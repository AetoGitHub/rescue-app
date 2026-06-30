import type {
  ClientContact,
  ClientContactCreateBody,
  ClientContactFormState,
  ClientContactUpdateBody,
} from '~/interfaces/catalogs/client';
import {
  formatMexicoPhoneInput,
  normalizeCatalogName,
} from '~/utils/catalog-form';

export function mapClientContactRow(
  raw: Record<string, unknown>,
): ClientContact {
  return {
    id: Number(raw.id),
    client_id: Number(raw.client_id ?? raw.client),
    name: String(raw.name ?? '').trim(),
    position: String(raw.position ?? '').trim(),
    email: String(raw.email ?? '').trim(),
    phone: String(raw.phone ?? '').trim(),
    whatsapp: String(raw.whatsapp ?? '').trim(),
    is_authorizer: Boolean(raw.is_authorizer),
    receives_quotes: Boolean(raw.receives_quotes),
    receives_oc_reminders: Boolean(raw.receives_oc_reminders),
    receives_account_status: Boolean(raw.receives_account_status),
    is_billing_contact: Boolean(raw.is_billing_contact),
    is_active: raw.is_active !== false,
  };
}

export function mapClientContactDetail(
  raw: Record<string, unknown>,
): ClientContactFormState {
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    position: String(raw.position ?? '').trim(),
    email: String(raw.email ?? '').trim(),
    phone: formatMexicoPhoneInput(String(raw.phone ?? '')),
    whatsapp: formatMexicoPhoneInput(String(raw.whatsapp ?? '')),
    is_authorizer: Boolean(raw.is_authorizer),
    receives_quotes: Boolean(raw.receives_quotes),
    receives_oc_reminders: Boolean(raw.receives_oc_reminders),
    receives_account_status: Boolean(raw.receives_account_status),
    is_billing_contact: Boolean(raw.is_billing_contact),
    is_active: raw.is_active !== false,
  };
}

export function clientContactFormToCreateBody(
  clientId: number,
  input: ClientContactFormState,
): ClientContactCreateBody {
  return {
    client: clientId,
    name: input.name,
    position: input.position,
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
    is_authorizer: input.is_authorizer,
    receives_quotes: input.receives_quotes,
    receives_oc_reminders: input.receives_oc_reminders,
    receives_account_status: input.receives_account_status,
    is_billing_contact: input.is_billing_contact,
  };
}

export function clientContactFormToUpdateBody(
  clientId: number,
  input: ClientContactFormState,
): ClientContactUpdateBody {
  return {
    ...clientContactFormToCreateBody(clientId, input),
    is_active: input.is_active,
  };
}

export function mapClientCsfUrl(raw: Record<string, unknown>): string | null {
  const value = raw.csf;
  if (value == null) return null;
  const url = String(value).trim();
  return url || null;
}
