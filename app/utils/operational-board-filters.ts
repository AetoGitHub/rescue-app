import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { OperationalBoardFilters } from '~/interfaces/operational/board-filters';
import { emptyCatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';

export function emptyOperationalBoardFilters(): OperationalBoardFilters {
  return {
    folio: '',
    serviceTypes: [],
    operativeStatus: null,
    company: emptyCatalogDropdownSelection(),
    manager: emptyCatalogDropdownSelection(),
    client: emptyCatalogDropdownSelection(),
    pendingAdvance: false,
    slaAlert: false,
    commentAlert: false,
  };
}

export function buildOperationalCardsQuery(
  status: OperationalRescueStatus,
  filters: OperationalBoardFilters,
): Record<string, string> {
  const query: Record<string, string> = { status };

  const folio = filters.folio.trim();
  if (folio) {
    query.folio = folio;
  }

  if (filters.serviceTypes.length > 0) {
    query.service_type = filters.serviceTypes.join(',');
  }

  if (filters.company.value != null) {
    query.company = String(filters.company.value);
  }

  if (filters.manager.value != null) {
    query.manager = String(filters.manager.value);
  }

  if (filters.client.value != null) {
    query.client = String(filters.client.value);
  }

  if (filters.pendingAdvance) {
    query.pending_advance = 'true';
  }

  if (filters.slaAlert) {
    query.sla_alert = 'true';
  }

  if (filters.commentAlert) {
    query.comment_alert = 'true';
  }

  return query;
}

/**
 * Query for GET /api/rescue/list/
 * Optional: `status`, `folio`, `service_type`, `company`, `manager`, `client`.
 */
export function buildOperationalListQuery(
  filters: OperationalBoardFilters,
): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters.operativeStatus != null) {
    query.status = filters.operativeStatus;
  }

  const folio = filters.folio.trim();
  if (folio) {
    query.folio = folio;
  }

  if (filters.serviceTypes.length > 0) {
    query.service_type = filters.serviceTypes.join(',');
  }

  if (filters.company.value != null) {
    query.company = String(filters.company.value);
  }

  if (filters.manager.value != null) {
    query.manager = String(filters.manager.value);
  }

  if (filters.client.value != null) {
    query.client = String(filters.client.value);
  }

  return query;
}

/** Pinia Colada key — params sent to the operational list API. */
export function operationalListApiFiltersKey(
  filters: OperationalBoardFilters,
): string[] {
  const serviceTypes = [...filters.serviceTypes].sort().join(',');

  return [
    filters.operativeStatus ?? '',
    filters.folio.trim(),
    serviceTypes,
    filters.company.value != null ? String(filters.company.value) : '',
    filters.manager.value != null ? String(filters.manager.value) : '',
    filters.client.value != null ? String(filters.client.value) : '',
  ];
}

export function operationalBoardFiltersKey(
  filters: OperationalBoardFilters,
): string[] {
  const serviceTypes = [...filters.serviceTypes].sort().join(',');

  return [
    filters.folio.trim(),
    serviceTypes,
    filters.company.value != null ? String(filters.company.value) : '',
    filters.manager.value != null ? String(filters.manager.value) : '',
    filters.client.value != null ? String(filters.client.value) : '',
    filters.pendingAdvance ? '1' : '0',
    filters.slaAlert ? '1' : '0',
    filters.commentAlert ? '1' : '0',
  ];
}

export function toggleOperationalServiceTypeFilter(
  serviceTypes: RescueServiceType[],
  value: RescueServiceType,
): RescueServiceType[] {
  if (serviceTypes.includes(value)) {
    return serviceTypes.filter((type) => type !== value);
  }

  return [...serviceTypes, value];
}

export function isOperationalServiceTypeActive(
  serviceTypes: RescueServiceType[],
  value: RescueServiceType,
): boolean {
  return serviceTypes.includes(value);
}
