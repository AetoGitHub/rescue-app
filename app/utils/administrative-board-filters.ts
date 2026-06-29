import {
  ADMINISTRATIVE_API_SERVICE_TYPES,
  ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS,
  type AdministrativeBillingStatus,
} from '~/constants/administrative-kanban';
import type { AdministrativeBoardFilters } from '~/interfaces/administrative/board-filters';
import type { AdministrativeRescueCard } from '~/interfaces/rescue/administrative';
import type { AdministrativeEligibleOperativeStatus } from '~/constants/administrative-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';

export function emptyAdministrativeBoardFilters(): AdministrativeBoardFilters {
  return {
    folio: '',
    createdFrom: '',
    createdTo: '',
    serviceTypes: [],
    operativeStatus: null,
    billingStatus: null,
    companyId: null,
    managerId: null,
    sellerId: null,
  };
}

const ALL_ADMINISTRATIVE_STATUSES = ADMINISTRATIVE_KANBAN_VISIBLE_COLUMNS.map(
  (column) => column.status,
);

function administrativeServiceTypesForApi(
  serviceTypes: RescueServiceType[],
): string {
  const allowed = new Set<string>(ADMINISTRATIVE_API_SERVICE_TYPES);
  return ADMINISTRATIVE_API_SERVICE_TYPES.filter((type) =>
    serviceTypes.includes(type as RescueServiceType),
  ).join(',');
}

/**
 * Query for GET /api/rescue/administrative/cards/
 * Required: `status`. Optional: `folio`, `service_type`, `company`.
 */
export function buildAdministrativeCardsQuery(
  columnStatus: AdministrativeBillingStatus | null,
  filters: AdministrativeBoardFilters,
): Record<string, string> {
  let status: string;

  if (columnStatus) {
    status = columnStatus;
  } else if (filters.billingStatus != null) {
    status = filters.billingStatus;
  } else {
    status = ALL_ADMINISTRATIVE_STATUSES.join(',');
  }

  const query: Record<string, string> = { status };

  const folio = filters.folio.trim();
  if (folio) {
    query.folio = folio;
  }

  if (filters.serviceTypes.length > 0) {
    const serviceType = administrativeServiceTypesForApi(filters.serviceTypes);
    if (serviceType) {
      query.service_type = serviceType;
    }
  }

  if (filters.companyId != null) {
    query.company = String(filters.companyId);
  }

  return query;
}

/**
 * Query for GET /api/rescue/administrative/list/
 * Optional: `status`, `folio`, `service_type`, `company`.
 */
export function buildAdministrativeListQuery(
  filters: AdministrativeBoardFilters,
): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters.billingStatus != null) {
    query.status = filters.billingStatus;
  }

  const folio = filters.folio.trim();
  if (folio) {
    query.folio = folio;
  }

  if (filters.serviceTypes.length > 0) {
    const serviceType = administrativeServiceTypesForApi(filters.serviceTypes);
    if (serviceType) {
      query.service_type = serviceType;
    }
  }

  if (filters.companyId != null) {
    query.company = String(filters.companyId);
  }

  return query;
}

/** Pinia Colada key — params sent to the administrative list API. */
export function administrativeListApiFiltersKey(
  filters: AdministrativeBoardFilters,
): string[] {
  const serviceTypes = [...filters.serviceTypes].sort().join(',');
  const billing = filters.billingStatus ?? '';

  return [
    billing,
    filters.folio.trim(),
    serviceTypes,
    filters.companyId != null ? String(filters.companyId) : '',
  ];
}

/** Pinia Colada key — params sent to the administrative cards API. */
export function administrativeCardsApiFiltersKey(
  filters: AdministrativeBoardFilters,
  columnStatus: AdministrativeBillingStatus | null,
): string[] {
  const serviceTypes = [...filters.serviceTypes].sort().join(',');
  const billing = filters.billingStatus ?? '';

  return [
    columnStatus ?? '',
    billing,
    filters.folio.trim(),
    serviceTypes,
    filters.companyId != null ? String(filters.companyId) : '',
  ];
}

/** Filters not yet on the administrative cards API. */
export function filterAdministrativeCardsLocally(
  cards: AdministrativeRescueCard[],
  filters: AdministrativeBoardFilters,
): AdministrativeRescueCard[] {
  let result = cards;

  if (filters.createdFrom) {
    const from = filters.createdFrom;
    result = result.filter((card) => card.created_at.slice(0, 10) >= from);
  }

  if (filters.createdTo) {
    const to = filters.createdTo;
    result = result.filter((card) => card.created_at.slice(0, 10) <= to);
  }

  if (filters.operativeStatus != null) {
    result = result.filter(
      (card) => card.operative_status === filters.operativeStatus,
    );
  }

  if (filters.billingStatus != null) {
    result = result.filter(
      (card) => card.billing_status === filters.billingStatus,
    );
  }

  if (filters.managerId != null) {
    result = result.filter((card) => card.operator_id === filters.managerId);
  }

  if (filters.sellerId != null) {
    result = result.filter((card) => card.seller_id === filters.sellerId);
  }

  const searchTerm = filters.folio.trim().toLowerCase();
  if (searchTerm) {
    result = result.filter(
      (card) =>
        card.folio.toLowerCase().includes(searchTerm)
        || card.client_name.toLowerCase().includes(searchTerm),
    );
  }

  return result;
}

export function toggleAdministrativeServiceTypeFilter(
  serviceTypes: RescueServiceType[],
  value: RescueServiceType,
): RescueServiceType[] {
  if (serviceTypes.includes(value)) {
    return serviceTypes.filter((type) => type !== value);
  }

  return [...serviceTypes, value];
}

export function isAdministrativeServiceTypeActive(
  serviceTypes: RescueServiceType[],
  value: RescueServiceType,
): boolean {
  return serviceTypes.includes(value);
}
