import type { CompanyCreateBody } from '~/interfaces/catalogs/company';
import type { ClientCreateBody } from '~/interfaces/catalogs/client';
import type { CreditFormState } from '~/interfaces/catalogs/credit';
import type { ServiceCreateBody } from '~/interfaces/catalogs/service';
import type {
  SupplierCreateBody,
  SupplierServiceType,
} from '~/interfaces/catalogs/supplier';

export function mapCompanyDetail(raw: Record<string, unknown>): CompanyCreateBody {
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    business_name: String(raw.business_name ?? ''),
    rfc: String(raw.rfc ?? ''),
    phone: String(raw.phone ?? ''),
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

export function mapClientDetail(raw: Record<string, unknown>): Omit<
  ClientCreateBody,
  'company' | 'seller'
> & {
  company?: number;
  seller?: number;
  credit_balance?: string;
} {
  const company = raw.company ?? raw.company_id;
  const seller = raw.seller ?? raw.seller_id;
  const credit = raw.credit_balance ?? raw.credit ?? raw.credit_limit;
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    business_name: String(raw.business_name ?? ''),
    rfc: String(raw.rfc ?? ''),
    phone: String(raw.phone ?? ''),
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
    company: base.company ?? 0,
    seller: base.seller ?? 0,
  };
}

export function mapServiceDetail(raw: Record<string, unknown>): ServiceCreateBody & {
  category?: number;
} {
  const cat = raw.category ?? raw.category_id;
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    description: String(raw.description ?? ''),
    category: cat != null && cat !== '' ? Number(cat) : undefined,
    unit: String(raw.unit ?? 'service'),
    warranty: Boolean(raw.warranty),
  };
}

export function mapCategoryDetail(raw: Record<string, unknown>): { name: string } {
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
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

function toSupplierServiceType(value: unknown): SupplierServiceType {
  const v = String(value ?? '');
  return (SUPPLIER_SERVICE_TYPES as readonly string[]).includes(v)
    ? (v as SupplierServiceType)
    : 'other';
}

export function mapSupplierDetail(
  raw: Record<string, unknown>,
): SupplierCreateBody {
  return {
    name: normalizeCatalogName(String(raw.name ?? '')),
    description: String(raw.description ?? ''),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    service_type: toSupplierServiceType(raw.service_type),
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
