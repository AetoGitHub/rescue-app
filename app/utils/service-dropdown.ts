import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export const SERVICE_DROPDOWN_PATH = '/api/catalogue/service/dropdown/';

/**
 * Filtros del dropdown de servicios en la cotización.
 * `has_client_contract` (id del cliente) hace que la API calcule `has_contract`
 * contra los contratos activos de ese cliente; sin él, `has_contract` siempre es false.
 */
export function buildServiceDropdownFilters(input: {
  clientId: number | null | undefined;
  onlyWithContract: boolean;
}): Record<string, unknown> | undefined {
  const filters: Record<string, unknown> = {};
  const clientId = input.clientId;
  if (clientId != null && Number.isInteger(clientId) && clientId > 0) {
    filters.has_client_contract = clientId;
  }
  if (input.onlyWithContract) {
    filters.has_contract = true;
  }
  return Object.keys(filters).length > 0 ? filters : undefined;
}

export function fetchQuoteServiceDropdown(
  name: string,
  options?: { signal?: AbortSignal; filters?: Record<string, unknown> },
) {
  const clientId = options?.filters?.has_client_contract;
  const hasContract = options?.filters?.has_contract;
  return $fetch<PaginatedResponse<CatalogDropdownRow>>(SERVICE_DROPDOWN_PATH, {
    query: {
      name,
      ...(typeof clientId === 'number' ? { has_client_contract: clientId } : {}),
      ...(hasContract ? { has_contract: true } : {}),
    },
    signal: options?.signal,
  });
}
