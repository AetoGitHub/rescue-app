import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { RescueServiceType } from '~/interfaces/rescue';
import type { OperationalBoardFilters } from '~/interfaces/operational/board-filters';

export function emptyOperationalBoardFilters(): OperationalBoardFilters {
  return {
    folio: '',
    serviceTypes: [],
    companyId: null,
    managerId: null,
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

  return query;
}

export function operationalBoardFiltersKey(
  filters: OperationalBoardFilters,
): [string, string, string, string] {
  const serviceTypes = [...filters.serviceTypes].sort().join(',');

  return [
    filters.folio.trim(),
    serviceTypes,
    filters.companyId != null ? String(filters.companyId) : '',
    filters.managerId != null ? String(filters.managerId) : '',
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
