import type { CompanyCreateBody } from '~/interfaces/catalogs/company';
import type { ClientCreateBody } from '~/interfaces/catalogs/client';
import type {
  ClientCreditSummary,
  ClientCreditInvoice,
  CreditFormState,
  CreditTemporaryUnlock,
  CreditUnlockMode,
} from '~/interfaces/catalogs/credit';
import { SERVICE_UNIT_VALUES } from '~/constants/catalog-select-options';
import type { ServiceCreateBody, ServiceUnit } from '~/interfaces/catalogs/service';
import type {
  SupplierCreateBody,
  SupplierServiceType,
} from '~/interfaces/catalogs/supplier';

export function mapCompanyDetail(raw: Record<string, unknown>): CompanyCreateBody {
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    business_name: String(raw.business_name ?? ''),
    rfc: normalizeCatalogName(String(raw.rfc ?? '')),
    phone: formatMexicoPhoneInput(String(raw.phone ?? '')),
    email: String(raw.email ?? ''),
    address: String(raw.address ?? ''),
    client_type: String(raw.client_type ?? 'CREDIT'),
    billing_type: String(raw.billing_type ?? 'DIRECT_INVOICE'),
    commission_type: String(raw.commission_type ?? 'PERCENTAGE'),
    commission_value: String(raw.commission_value ?? '0.00'),
    commission_fixed: String(raw.commission_fixed ?? '0.00'),
    price_multiplier: String(raw.price_multiplier ?? '1.00'),
  };
}

/** Copies company catalog fields into a client draft; does not set `name`. */
export function applyCompanyDetailToClientDraft<
  T extends Pick<
    CompanyCreateBody,
    | 'business_name'
    | 'rfc'
    | 'phone'
    | 'email'
    | 'address'
    | 'client_type'
    | 'billing_type'
    | 'commission_type'
    | 'commission_value'
    | 'commission_fixed'
    | 'price_multiplier'
  >,
>(target: T, company: CompanyCreateBody): void {
  target.business_name = company.business_name;
  target.rfc = company.rfc;
  target.phone = company.phone;
  target.email = company.email;
  target.address = company.address;
  target.client_type = company.client_type;
  target.billing_type = company.billing_type;
  target.commission_type = company.commission_type;
  target.commission_value = company.commission_value;
  target.commission_fixed = company.commission_fixed;
  target.price_multiplier = company.price_multiplier;
}

function mapCreditInfoBuckets(raw: Record<string, unknown>): {
  overdue_amount: number | null;
  overdue_invoices_count: number;
  due_soon_amount: number | null;
  due_soon_invoices_count: number;
} {
  const creditInfo =
    typeof raw.credit_info === 'object' && raw.credit_info != null
      ? (raw.credit_info as Record<string, unknown>)
      : null;
  const overdue =
    creditInfo != null &&
    typeof creditInfo.overdue === 'object' &&
    creditInfo.overdue != null
      ? (creditInfo.overdue as Record<string, unknown>)
      : null;
  const upcoming =
    creditInfo != null &&
    typeof creditInfo.upcoming === 'object' &&
    creditInfo.upcoming != null
      ? (creditInfo.upcoming as Record<string, unknown>)
      : null;

  const overdueAmount = overdue?.amount ?? raw.overdue_amount ?? raw.credit_overdue_amount;
  const upcomingAmount =
    upcoming?.amount ?? raw.due_soon_amount ?? raw.credit_due_soon_amount;

  return {
    overdue_amount:
      overdueAmount != null && overdueAmount !== '' && Number.isFinite(Number(overdueAmount))
        ? Number(overdueAmount)
        : null,
    overdue_invoices_count:
      Number(overdue?.count ?? raw.overdue_invoices_count ?? 0) || 0,
    due_soon_amount:
      upcomingAmount != null &&
      upcomingAmount !== '' &&
      Number.isFinite(Number(upcomingAmount))
        ? Number(upcomingAmount)
        : null,
    due_soon_invoices_count:
      Number(upcoming?.count ?? raw.due_soon_invoices_count ?? 0) || 0,
  };
}

function creditNestedRecord(
  raw: Record<string, unknown>,
): Record<string, unknown> | null {
  const credit = raw.credit;
  if (typeof credit === 'object' && credit != null) {
    return credit as Record<string, unknown>;
  }
  return null;
}

const LOAN_MARGIN_PERCENT_KEYS = [
  'loan_margin',
  'loan_margin_percent',
  'margin_loan',
  'prestamo_margin',
] as const;

function parseLoanMarginPercentValue(value: unknown): number | null {
  if (value == null || value === '') return null;
  const normalized = String(value).trim().replace(/%$/, '').replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Resolves loan margin percent from client detail (top-level or nested `credit`). */
export function resolveClientLoanMarginPercent(
  raw: Record<string, unknown>,
): number | null {
  const nested = creditNestedRecord(raw);
  const sources = nested != null ? [raw, nested] : [raw];

  for (const source of sources) {
    for (const key of LOAN_MARGIN_PERCENT_KEYS) {
      const parsed = parseLoanMarginPercentValue(source[key]);
      if (parsed != null) return parsed;
    }
  }

  return null;
}

/** Merges top-level client fields with nested `credit` object for summary mapping. */
function mergeClientCreditRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = creditNestedRecord(raw);
  if (nested == null) return raw;
  return {
    ...raw,
    ...nested,
    credit_info: nested.credit_info ?? raw.credit_info,
  };
}

export function resolveCreditId(raw: Record<string, unknown>): number | null {
  const direct = raw.credit_id ?? raw.creditId;
  if (direct != null && direct !== '') {
    const id = Number(direct);
    return Number.isFinite(id) ? id : null;
  }
  const credit = raw.credit;
  if (credit != null && credit !== '') {
    if (typeof credit === 'object') {
      const nestedId = (credit as Record<string, unknown>).id;
      if (nestedId != null && nestedId !== '') {
        const id = Number(nestedId);
        return Number.isFinite(id) ? id : null;
      }
    } else {
      const id = Number(credit);
      if (Number.isFinite(id) && id > 0) return id;
    }
  }
  const selfId = raw.id;
  if (
    raw.client_id != null &&
    selfId != null &&
    selfId !== '' &&
    (raw.limit != null || raw.credit_used != null)
  ) {
    const id = Number(selfId);
    return Number.isFinite(id) ? id : null;
  }
  return null;
}

export function mapCreditDetail(raw: Record<string, unknown>): {
  form: Partial<CreditFormState>;
  summary: ClientCreditSummary;
  creditId: number;
} {
  const creditId = resolveCreditId(raw) ?? Number(raw.id);
  const info = mapCreditInfoBuckets(raw);
  const limit = raw.limit ?? raw.credit_limit;
  const used = raw.credit_used;
  const available = raw.credit_available;

  const form = mapClientCreditForm(raw);

  return {
    creditId: Number.isFinite(creditId) ? creditId : 0,
    form,
    summary: {
      credit_id: Number.isFinite(creditId) ? creditId : null,
      credit_limit: limit != null && limit !== '' ? String(limit) : null,
      credit_used: used != null && used !== '' ? String(used) : null,
      credit_available:
        available != null && available !== '' && Number.isFinite(Number(available))
          ? Number(available)
          : null,
      overdue_amount: info.overdue_amount,
      overdue_invoices_count: info.overdue_invoices_count,
      due_soon_amount: info.due_soon_amount,
      due_soon_invoices_count: info.due_soon_invoices_count,
    },
  };
}

function parseCreditMoney(value: string | number | null | undefined): number {
  if (value == null || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isCashLikeClientType(clientType: string | null | undefined): boolean {
  return clientType === 'CASH' || clientType === 'PUBLIC';
}

/** Normalizes summary + form when the client has no linked credit record. */
export function hydrateClientCreditDisplayWithoutLine(
  clientType: string,
  summary: ClientCreditSummary,
  form: Partial<CreditFormState>,
): { summary: ClientCreditSummary; form: CreditFormState } {
  const nextSummary: ClientCreditSummary = { ...summary };

  if (nextSummary.credit_limit == null || nextSummary.credit_limit === '') {
    nextSummary.credit_limit = isCashLikeClientType(clientType)
      ? '0.00'
      : (form.limit ?? '0.00');
  }

  if (nextSummary.credit_available == null) {
    const limit = parseCreditMoney(nextSummary.credit_limit);
    const used = parseCreditMoney(nextSummary.credit_used);
    nextSummary.credit_available = limit - used;
  }

  return {
    summary: nextSummary,
    form: {
      limit: nextSummary.credit_limit ?? '0.00',
      days: form.days ?? (isCashLikeClientType(clientType) ? 0 : 30),
      extension: form.extension ?? 0,
      remision_tolerance: form.remision_tolerance ?? 0,
      requires_purchase_order: form.requires_purchase_order ?? false,
      is_blocked: form.is_blocked ?? false,
    },
  };
}

export function mapClientCreditInvoice(raw: Record<string, unknown>): ClientCreditInvoice {
  const id = Number(raw.id);
  const daysRaw = raw.days_overdue ?? raw.overdue_days ?? raw.days;
  const daysParsed = daysRaw != null && daysRaw !== '' ? Number(daysRaw) : NaN;

  return {
    id: Number.isFinite(id) ? id : 0,
    folio:
      String(raw.folio ?? raw.invoice_number ?? raw.number ?? '').trim() || undefined,
    amount: (raw.amount ?? raw.total ?? raw.balance) as string | number | undefined,
    billed_at:
      String(raw.billed_at ?? raw.invoice_date ?? raw.date ?? '').trim() || undefined,
    days_overdue: Number.isFinite(daysParsed) ? Math.trunc(daysParsed) : undefined,
    status: String(raw.status ?? '').trim() || undefined,
  };
}

export function mapClientCreditSummary(
  raw: Record<string, unknown>,
): ClientCreditSummary {
  const merged = mergeClientCreditRaw(raw);
  const limit = merged.credit_limit ?? merged.limit;
  const used = merged.credit_used;
  const available = merged.credit_available;
  const info = mapCreditInfoBuckets(merged);
  const creditId = resolveCreditId(raw);

  return {
    credit_id: creditId,
    credit_limit: limit != null && limit !== '' ? String(limit) : null,
    credit_used: used != null && used !== '' ? String(used) : null,
    credit_available:
      available != null && available !== '' && Number.isFinite(Number(available))
        ? Number(available)
        : null,
    overdue_amount: info.overdue_amount,
    overdue_invoices_count: info.overdue_invoices_count,
    due_soon_amount: info.due_soon_amount,
    due_soon_invoices_count: info.due_soon_invoices_count,
  };
}

export function mapClientDetail(raw: Record<string, unknown>): Omit<
  ClientCreateBody,
  'company' | 'seller'
> & {
  company?: number;
  seller?: number;
  credit_balance?: string;
  is_active?: boolean;
} {
  const company = raw.company ?? raw.company_id;
  const seller = raw.seller ?? raw.seller_id;
  const credit = raw.credit_balance ?? raw.credit ?? raw.credit_limit;
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    business_name: String(raw.business_name ?? ''),
    rfc: normalizeCatalogName(String(raw.rfc ?? '')),
    phone: formatMexicoPhoneInput(String(raw.phone ?? '')),
    email: String(raw.email ?? ''),
    address: String(raw.address ?? ''),
    client_type: String(raw.client_type ?? 'CASH'),
    billing_type: String(raw.billing_type ?? 'MANUAL'),
    commission_type: String(raw.commission_type ?? 'FIXED'),
    commission_value: String(raw.commission_value ?? '0.00'),
    commission_fixed: String(raw.commission_fixed ?? '0.00'),
    price_multiplier: String(raw.price_multiplier ?? '1.00'),
    company: company != null && company !== '' ? Number(company) : undefined,
    seller: seller != null && seller !== '' ? Number(seller) : undefined,
    notes: String(raw.notes ?? ''),
    is_active: raw.is_active != null ? Boolean(raw.is_active) : true,
    credit_balance:
      credit != null && credit !== '' ? String(credit) : undefined,
  };
}

export function mapClientCreditForm(
  raw: Record<string, unknown>,
): Partial<CreditFormState> {
  const nested =
    typeof raw.credit === 'object' && raw.credit != null
      ? (raw.credit as Record<string, unknown>)
      : null;
  const source = nested ?? raw;

  const limit = source.limit ?? source.credit_limit ?? raw.credit_limit;
  const days = source.days ?? source.credit_days;
  const extension = source.extension ?? source.credit_extension;
  const remisionTolerance =
    source.remision_tolerance ?? source.remission_tolerance;
  const requiresPurchaseOrder = source.requires_purchase_order;
  const isBlocked = source.is_blocked;

  const mapped: Partial<CreditFormState> = {};

  if (limit != null && limit !== '') {
    mapped.limit = String(limit);
  }
  if (days != null && days !== '') {
    const parsedDays = Number(days);
    if (Number.isFinite(parsedDays)) mapped.days = Math.trunc(parsedDays);
  }
  if (extension != null && extension !== '') {
    const parsedExtension = Number(extension);
    if (Number.isFinite(parsedExtension)) {
      mapped.extension = Math.trunc(parsedExtension);
    }
  }
  if (remisionTolerance != null && remisionTolerance !== '') {
    const parsedTolerance = Number(remisionTolerance);
    if (Number.isFinite(parsedTolerance)) {
      mapped.remision_tolerance = Math.trunc(parsedTolerance);
    }
  }
  if (requiresPurchaseOrder != null) {
    mapped.requires_purchase_order = Boolean(requiresPurchaseOrder);
  }
  if (isBlocked != null) {
    mapped.is_blocked = Boolean(isBlocked);
  }

  return mapped;
}

export function mapClientDetailToCreateBody(
  raw: Record<string, unknown>,
): ClientCreateBody {
  const base = mapClientDetail(raw);
  return {
    ...base,
    company: base.company ?? null,
    seller: base.seller ?? 0,
  };
}

function toServiceUnit(value: unknown): ServiceUnit {
  const unit = String(value ?? '');
  return (SERVICE_UNIT_VALUES as readonly string[]).includes(unit)
    ? (unit as ServiceUnit)
    : 'service';
}

export function mapServiceDetail(raw: Record<string, unknown>): ServiceCreateBody & {
  category?: number;
} {
  const cat = raw.category ?? raw.category_id;
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    description: String(raw.description ?? ''),
    category: cat != null && cat !== '' ? Number(cat) : undefined,
    unit: toServiceUnit(raw.unit),
    warranty: Boolean(raw.warranty),
  };
}

const SUPPLIER_SERVICE_TYPES: readonly SupplierServiceType[] = [
  'cranes',
  'mechanics',
  'road_assist',
  'forklifts',
  'flatbed',
  'transport',
  'other',
];

export function toSupplierServiceTypes(value: unknown): SupplierServiceType[] {
  if (Array.isArray(value)) {
    const mapped = value
      .map((item) => String(item ?? ''))
      .filter((item): item is SupplierServiceType =>
        (SUPPLIER_SERVICE_TYPES as readonly string[]).includes(item),
      );
    return mapped.length > 0 ? [...new Set(mapped)] : ['other'];
  }
  const v = String(value ?? '');
  if ((SUPPLIER_SERVICE_TYPES as readonly string[]).includes(v)) {
    return [v as SupplierServiceType];
  }
  return ['other'];
}

export function mapSupplierDetail(
  raw: Record<string, unknown>,
): SupplierCreateBody {
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    description: String(raw.description ?? ''),
    phone: formatMexicoPhoneInput(String(raw.phone ?? '')),
    email: String(raw.email ?? ''),
    service_type: toSupplierServiceTypes(raw.service_types ?? raw.service_type),
    is_trusted: Boolean(raw.is_trusted),
    notes: String(raw.notes ?? ''),
    latitude: raw.latitude != null ? String(raw.latitude) : '',
    longitude: raw.longitude != null ? String(raw.longitude) : '',
  };
}

export type ContractLineFormRow = {
  service?: number;
  price: string;
  price_multiplier: string;
  percentaje: string;
  notes: string;
};

export type ContractFormFromDetail = {
  client?: number;
  notes: string;
  items: ContractLineFormRow[];
};

export type ContractHeaderFromDetail = {
  client?: number;
  clientName: string;
  notes: string;
};

function mapContractLine(it: Record<string, unknown>): ContractLineFormRow {
  const svc = it.service ?? it.service_id;
  return {
    service: svc != null && svc !== '' ? Number(svc) : undefined,
    price: String(it.price ?? ''),
    price_multiplier: String(it.price_multiplier ?? ''),
    percentaje: String(it.percentaje ?? it.percentage ?? ''),
    notes: String(it.notes ?? ''),
  };
}

export function mapContractHeaderDetail(
  raw: Record<string, unknown>,
): ContractHeaderFromDetail {
  const client = raw.client ?? raw.client_id;
  const clientName =
    typeof raw.client_name === 'string'
      ? raw.client_name
      : typeof raw.client === 'object' && raw.client != null && 'name' in raw.client
        ? String((raw.client as Record<string, unknown>).name ?? '')
        : '';

  return {
    client: client != null && client !== '' ? Number(client) : undefined,
    clientName,
    notes: String(raw.notes ?? ''),
  };
}

export function mapContractDetailToForm(
  raw: Record<string, unknown>,
): ContractFormFromDetail {
  const client = raw.client ?? raw.client_id;
  const itemsRaw = raw.items;
  const lines = Array.isArray(itemsRaw)
    ? (itemsRaw as Record<string, unknown>[]).map(mapContractLine)
    : [];

  return {
    client: client != null && client !== '' ? Number(client) : undefined,
    notes: String(raw.notes ?? ''),
    items:
      lines.length > 0
        ? lines
        : [
            {
              price: '',
              price_multiplier: '',
              percentaje: '',
              notes: '',
            },
          ],
  };
}

function normalizeCreditUnlockMode(value: unknown): CreditUnlockMode {
  return String(value ?? '').toLowerCase() === 'days' ? 'days' : 'money';
}

export function mapCreditTemporaryUnlock(
  raw: Record<string, unknown>,
): CreditTemporaryUnlock {
  const creditId = Number(raw.credit_id ?? raw.credit ?? 0);
  const expiresAt = raw.expires_at;

  return {
    id: Number(raw.id ?? 0),
    credit_id: Number.isFinite(creditId) ? creditId : 0,
    mode: normalizeCreditUnlockMode(raw.mode),
    value: String(raw.value ?? '0.00'),
    remaining: String(raw.remaining ?? raw.value ?? '0.00'),
    active: Boolean(raw.active),
    created_at: String(raw.created_at ?? ''),
    expires_at:
      expiresAt != null && String(expiresAt).trim() !== ''
        ? String(expiresAt)
        : null,
  };
}
