import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { OperationalBoardFilters } from '~/interfaces/operational/board-filters';

export function emptyOperationalBoardFilters(): OperationalBoardFilters {
  return {
    folio: '',
    serviceTypes: [],
    operativeStatuses: [],
    companyId: null,
    managerId: null,
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

  if (filters.companyId != null) {
    query.company = String(filters.companyId);
  }

  if (filters.managerId != null) {
    query.manager = String(filters.managerId);
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
 * Optional: `status`, `folio`, `service_type`, `company`, `manager`.
 */
export function buildOperationalListQuery(
  filters: OperationalBoardFilters,
): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters.operativeStatuses.length > 0) {
    query.status = [...filters.operativeStatuses].sort().join(',');
  }

  const folio = filters.folio.trim();
  if (folio) {
    query.folio = folio;
  }

  if (filters.serviceTypes.length > 0) {
    query.service_type = filters.serviceTypes.join(',');
  }

  if (filters.companyId != null) {
    query.company = String(filters.companyId);
  }

  if (filters.managerId != null) {
    query.manager = String(filters.managerId);
  }

  return query;
}

/** Pinia Colada key — params sent to the operational list API. */
export function operationalListApiFiltersKey(
  filters: OperationalBoardFilters,
): string[] {
  const serviceTypes = [...filters.serviceTypes].sort().join(',');
  const operativeStatuses = [...filters.operativeStatuses].sort().join(',');

  return [
    operativeStatuses,
    filters.folio.trim(),
    serviceTypes,
    filters.companyId != null ? String(filters.companyId) : '',
    filters.managerId != null ? String(filters.managerId) : '',
  ];
}

export function operationalBoardFiltersKey(
  filters: OperationalBoardFilters,
): [string, string, string, string, string, string, string] {
  const serviceTypes = [...filters.serviceTypes].sort().join(',');

  return [
    filters.folio.trim(),
    serviceTypes,
    filters.companyId != null ? String(filters.companyId) : '',
    filters.managerId != null ? String(filters.managerId) : '',
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

export function toggleOperationalOperativeStatusFilter(
  statuses: OperationalRescueStatus[],
  value: OperationalRescueStatus,
): OperationalRescueStatus[] {
  if (statuses.includes(value)) {
    return statuses.filter((status) => status !== value);
  }

  return [...statuses, value];
}

export function isOperationalOperativeStatusActive(
  statuses: OperationalRescueStatus[],
  value: OperationalRescueStatus,
): boolean {
  return statuses.includes(value);
}
