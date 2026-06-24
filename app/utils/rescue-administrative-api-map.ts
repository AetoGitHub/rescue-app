import {
  ADMINISTRATIVE_KANBAN_COLUMNS,
  type AdministrativeBillingStatus,
} from '~/constants/administrative-kanban';
import {
  normalizeClientBillingType,
  type ClientBillingType,
} from '~/constants/rescue-administrative-flow';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type {
  AdministrativeRescueCard,
  AdministrativeRescueDetail,
  RescueAdministrativeActionId,
  RescueAdministrativeChangePhaseBody,
  RescueAdministrativePaymentFormState,
  RescueInvoiceFormState,
  RescueRemittanceFormState,
} from '~/interfaces/rescue/administrative';

const VALID_BILLING_STATUSES = new Set(
  ADMINISTRATIVE_KANBAN_COLUMNS.map((column) => column.status),
);

/** Legacy / Spanish slugs → API admin_status. */
const ADMIN_STATUS_ALIASES: Record<string, AdministrativeBillingStatus> = {
  sin_atender: 'unattended',
  en_remision: 'in_remittance',
  facturado: 'invoiced',
  pagado: 'paid',
  garantia: 'warranty',
  cancelado: 'canceled',
  admin_canceled: 'canceled',
};

const DEFAULT_BILLING_STATUS: AdministrativeBillingStatus = 'unattended';

function normalizeBillingStatus(
  value: string,
): AdministrativeBillingStatus {
  const trimmed = value.trim();
  if (VALID_BILLING_STATUSES.has(trimmed as AdministrativeBillingStatus)) {
    return trimmed as AdministrativeBillingStatus;
  }

  return ADMIN_STATUS_ALIASES[trimmed] ?? DEFAULT_BILLING_STATUS;
}

/** API `admin_status` on administrative cards (not gestor agent status). */
function readBillingStatus(
  raw: Record<string, unknown>,
): AdministrativeBillingStatus {
  const adminStatus = raw.admin_status;
  if (typeof adminStatus === 'string' && adminStatus.trim()) {
    return normalizeBillingStatus(adminStatus);
  }

  const billingStatus = raw.billing_status;
  if (typeof billingStatus === 'string' && billingStatus.trim()) {
    return normalizeBillingStatus(billingStatus);
  }

  const legacy = raw.estatus_admin;
  if (typeof legacy === 'string' && legacy.trim()) {
    return normalizeBillingStatus(legacy);
  }

  return DEFAULT_BILLING_STATUS;
}

function readString(raw: Record<string, unknown>, key: string): string | null {
  const value = raw[key];
  if (value == null || value === '') return null;
  return String(value);
}

function readUnlockUntil(raw: Record<string, unknown>): string | null {
  return (
    readString(raw, 'unlocked_until')
    ?? readString(raw, 'unlockedUntil')
  );
}

function readNumber(raw: Record<string, unknown>, key: string): number | null {
  const value = raw[key];
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveRequiresRemision(billingType: ClientBillingType): boolean {
  return billingType === 'REMISSION' || billingType === 'MANUAL';
}

/** Unwrap administrative detail API payloads (flat or nested). */
export function unwrapAdministrativeDetailRecord(
  payload: unknown,
): Record<string, unknown> {
  if (payload == null || typeof payload !== 'object') {
    return {};
  }

  const record = payload as Record<string, unknown>;

  for (const key of ['data', 'result', 'card', 'rescue'] as const) {
    const nested = record[key];
    if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }

  return record;
}

export function mapAdministrativeCardFromApi(
  raw: Record<string, unknown>,
): AdministrativeRescueCard {
  const subTotal =
    readString(raw, 'sub_total') ?? readString(raw, 'total');

  const phaseStartedAt = readString(raw, 'phase_started_at');

  return {
    id: Number(raw.id),
    folio: String(raw.folio ?? ''),
    service_type: String(raw.service_type ?? 'rescue'),
    client_id: Number(raw.client_id ?? raw.client ?? 0),
    client_name: String(raw.client_name ?? ''),
    service_description: readString(raw, 'service_description') ?? '',
    location_description:
      readString(raw, 'location_description')
      ?? readString(raw, 'description')
      ?? '',
    operator_id: readNumber(raw, 'operator_id') ?? readNumber(raw, 'operator'),
    operator_name: readString(raw, 'operator_name'),
    supplier_id: readNumber(raw, 'supplier_id') ?? readNumber(raw, 'supplier'),
    supplier_name: readString(raw, 'supplier_name'),
    multiple_managers: Boolean(raw.multiple_managers),
    sub_total: subTotal,
    sale_price: subTotal,
    net_profit:
      readString(raw, 'net_profit') ?? readString(raw, 'provider_profit'),
    operative_status: String(
      raw.operative_status ?? 'closed',
    ) as OperationalRescueStatus,
    billing_status: readBillingStatus(raw),
    created_at: String(raw.created_at ?? ''),
    phase_started_at: phaseStartedAt,
    last_comment_at: readString(raw, 'last_comment_at'),
    unlocked_until: readUnlockUntil(raw),
    service_date:
      readString(raw, 'service_date')
      ?? readString(raw, 'close_date')
      ?? phaseStartedAt,
    seller_id: readNumber(raw, 'seller_id'),
    remittance_folio:
      readString(raw, 'remittance_folio')
      ?? readString(raw, 'remittance_number'),
    invoice_folio:
      readString(raw, 'invoice_folio')
      ?? readString(raw, 'invoice_number'),
  };
}

export function mapAdministrativeDetailFromApi(
  raw: Record<string, unknown>,
): AdministrativeRescueDetail {
  const card = mapAdministrativeCardFromApi(raw);
  const clientType = String(raw.client_type ?? 'CASH');
  const clientBillingType = normalizeClientBillingType(
    readString(raw, 'client_billing_type')
    ?? readString(raw, 'billing_type'),
  );

  return {
    ...card,
    unlocked_until: readUnlockUntil(raw) ?? card.unlocked_until,
    net_profit:
      readString(raw, 'net_profit') ?? readString(raw, 'provider_profit'),
    sale_price:
      readString(raw, 'sale_price') ?? card.sale_price,
    client_type: clientType,
    client_billing_type: clientBillingType,
    billing_type: clientBillingType,
    client_phone: readString(raw, 'client_phone'),
    seller_name: readString(raw, 'seller_name'),
    requires_purchase_order: Boolean(
      raw.requires_purchase_order ?? raw.requiere_oc,
    ),
    purchase_order_number:
      readString(raw, 'purchase_order_number')
      ?? readString(raw, 'oc_number'),
    requires_remision:
      raw.requires_remision != null
        ? Boolean(raw.requires_remision)
        : deriveRequiresRemision(clientBillingType),
    remittance_number:
      readString(raw, 'remittance_number')
      ?? readString(raw, 'remittance_folio')
      ?? readString(raw, 'remision_number'),
    invoice_number:
      readString(raw, 'invoice_number')
      ?? readString(raw, 'invoice_folio'),
    invoice_date: readString(raw, 'invoice_date'),
    invoice_amount:
      readString(raw, 'invoice_amount')
      ?? readString(raw, 'invoiced_amount'),
    payment_amount: readString(raw, 'payment_amount'),
    payment_date: readString(raw, 'payment_date'),
    payment_method: readString(raw, 'payment_method'),
    payment_reference: readString(raw, 'payment_reference'),
    closed_at: readString(raw, 'closed_at') ?? readString(raw, 'fecha_cierre'),
    admin_cancellation_reason: readString(raw, 'admin_cancellation_reason'),
    admin_cancellation_reason_id: readNumber(raw, 'admin_cancellation_reason'),
    provider_cost: readString(raw, 'provider_cost'),
    vehicle: readString(raw, 'vehicle'),
    latitude: readString(raw, 'latitude'),
    longitude: readString(raw, 'longitude'),
    supplier_score: readNumber(raw, 'supplier_score'),
  };
}

/** Kanban row → minimal detail for instant modal preview while GET detail loads. */
export function cardToAdministrativePreviewDetail(
  card: AdministrativeRescueCard,
): AdministrativeRescueDetail {
  return {
    ...card,
    client_type: 'CASH',
    client_billing_type: 'DIRECT_INVOICE',
    billing_type: 'DIRECT_INVOICE',
    client_phone: null,
    seller_name: null,
    requires_purchase_order: false,
    purchase_order_number: null,
    requires_remision: false,
    remittance_number: card.remittance_folio,
    invoice_number: card.invoice_folio,
    invoice_date: null,
    invoice_amount: null,
    payment_amount: null,
    payment_date: null,
    payment_method: null,
    payment_reference: null,
    closed_at: null,
    admin_cancellation_reason: null,
    admin_cancellation_reason_id: null,
    provider_cost: null,
    vehicle: null,
    latitude: null,
    longitude: null,
    supplier_score: null,
  };
}

/** Map administrative detail for reuse of operational General tab + map. */
export function administrativeDetailToCardDetail(
  detail: AdministrativeRescueDetail,
): RescueCardDetail {
  return {
    id: detail.id,
    folio: detail.folio,
    service_type: detail.service_type,
    client_id: detail.client_id,
    client_name: detail.client_name,
    service_description: detail.service_description,
    location_description: detail.location_description,
    sale_price: detail.sale_price,
    operative_status: detail.operative_status,
    operator_id: detail.operator_id,
    operator_name: detail.operator_name,
    supplier_id: detail.supplier_id,
    supplier_name: detail.supplier_name,
    multiple_managers: detail.multiple_managers,
    sub_total: detail.sub_total,
    admin_status: 'working',
    created_at: detail.created_at,
    phase_started_at: detail.phase_started_at ?? detail.created_at,
    unlocked_until: detail.unlocked_until,
    client_type: detail.client_type,
    client_phone: detail.client_phone,
    seller_id: detail.seller_id,
    seller_name: detail.seller_name,
    vehicle: detail.vehicle,
    provider_cost: detail.provider_cost,
    net_profit: detail.net_profit,
    supplier_score: detail.supplier_score,
    latitude: detail.latitude,
    longitude: detail.longitude,
  };
}

export function isAdministrativePhaseChange(
  body: RescueAdministrativeChangePhaseBody,
): boolean {
  return body.billing_status != null;
}

export function mapAdministrativeChangeAdminStatusToApi(
  body: RescueAdministrativeChangePhaseBody,
): Record<string, unknown> {
  const api: Record<string, unknown> = {};

  if (body.billing_status != null) {
    api.to = body.billing_status;
  }

  if (body.remittance_number != null) {
    api.remittance_folio = body.remittance_number;
  }

  if (body.invoice_number != null) {
    api.invoice_folio = body.invoice_number;
  }
  if (body.invoice_date != null) {
    api.invoice_date = body.invoice_date;
  }
  if (body.invoice_amount != null) {
    api.invoiced_amount = body.invoice_amount;
  }
  if (body.invoice_notes != null) {
    api.notes = body.invoice_notes;
  }

  if (body.payment_evidence_url != null) {
    api.payment_evidence_url = body.payment_evidence_url;
  }

  if (body.admin_cancellation_reason != null) {
    api.cancellation_reason = body.admin_cancellation_reason;
  }

  return api;
}

/** Legacy shape for purchase order save only. */
export function mapAdministrativeLegacyUpdateToApi(
  body: RescueAdministrativeChangePhaseBody,
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  if (body.purchase_order_number != null) {
    mapped.purchase_order_number = body.purchase_order_number;
  }

  return mapped;
}

export function mapAdministrativeUpdateToApi(
  body: RescueAdministrativeChangePhaseBody,
): Record<string, unknown> {
  if (isAdministrativePhaseChange(body)) {
    return mapAdministrativeChangeAdminStatusToApi(body);
  }
  return mapAdministrativeLegacyUpdateToApi(body);
}

export function targetBillingStatusForAction(
  action: RescueAdministrativeActionId,
): AdministrativeBillingStatus | null {
  switch (action) {
    case 'issue_remittance':
      return 'in_remittance';
    case 'skip_to_invoiced':
    case 'register_invoice':
      return 'invoiced';
    case 'apply_payment':
      return 'paid';
    case 'admin_cancel':
      return 'canceled';
    case 'open_warranty':
      return 'warranty';
    default:
      return null;
  }
}

export function toAdministrativeUpdatePayload(
  action: RescueAdministrativeActionId,
  forms?: {
    remittance?: RescueRemittanceFormState;
    invoice?: RescueInvoiceFormState;
    payment?: RescueAdministrativePaymentFormState;
    purchaseOrderNumber?: string;
    cancellationReasonId?: number | null;
    invoiceNotes?: string;
  },
): RescueAdministrativeChangePhaseBody {
  const billingStatus = targetBillingStatusForAction(action);
  const body: RescueAdministrativeChangePhaseBody = {};

  if (billingStatus) {
    body.billing_status = billingStatus;
  }

  switch (action) {
    case 'issue_remittance':
      body.remittance_number = forms?.remittance?.remittance_number;
      break;

    case 'skip_to_invoiced':
      if (forms?.invoice) {
        body.invoice_number = forms.invoice.invoice_number;
        body.invoice_date = forms.invoice.invoice_date;
        body.invoice_amount = forms.invoice.invoice_amount;
        body.invoice_notes = forms.invoiceNotes ?? '';
      }
      break;

    case 'register_invoice':
      body.invoice_number = forms?.invoice?.invoice_number;
      body.invoice_date = forms?.invoice?.invoice_date;
      body.invoice_amount = forms?.invoice?.invoice_amount;
      body.invoice_notes = forms?.invoiceNotes ?? '';
      break;

    case 'apply_payment':
      body.payment_evidence_url = forms?.payment?.payment_evidence_url;
      break;

    case 'admin_cancel':
      if (forms?.cancellationReasonId != null) {
        body.admin_cancellation_reason = forms.cancellationReasonId;
      }
      break;

    case 'open_warranty':
      break;

    case 'save_purchase_order':
      body.purchase_order_number = forms?.purchaseOrderNumber;
      break;

    default:
      break;
  }

  return body;
}

export function sumAdministrativeSalePrices(
  cards: AdministrativeRescueCard[],
): number {
  return cards.reduce((sum, card) => {
    const raw = card.sale_price;
    if (raw == null || raw === '') return sum;
    const parsed = Number(String(raw).replace(/,/g, ''));
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
}
