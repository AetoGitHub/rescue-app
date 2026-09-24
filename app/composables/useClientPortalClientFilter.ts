import { useQuery } from '@pinia/colada';
import {
  CLIENT_PORTAL_CLIENTS_DROPDOWN_PATH,
  CLIENT_PORTAL_CLIENTS_DROPDOWN_QUERY_KEY,
} from '~/constants/client-portal-api';
import type { ClientPortalDropdownApiRow } from '~/interfaces/invoicing/client-portal';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  clientPortalClientsQuery,
  mapClientPortalDropdownRows,
} from '~/utils/client-portal-filter';

/**
 * Filtro "por cliente" aplicado en el portal de cliente.
 *
 * Vive en `useState`: se conserva al cambiar entre Por Facturar y Por Cobrar
 * y se pierde al refrescar la pantalla. Solo cambia con `apply` / `clear`;
 * los reportes del portal mandan `?clients=` a partir de `clientsQuery`.
 */
export function useClientPortalClientFilter() {
  const appliedClientIds = useState<number[]>(
    'client-portal-applied-clients',
    () => [],
  );

  const clientsQuery = computed(() =>
    clientPortalClientsQuery(appliedClientIds.value),
  );

  function apply(ids: number[]) {
    appliedClientIds.value = [...new Set(ids)];
  }

  function clear() {
    appliedClientIds.value = [];
  }

  return { appliedClientIds, clientsQuery, apply, clear };
}

/**
 * Opciones del selector: drena todas las páginas del cursor una sola vez para
 * buscar en memoria sin volver a consultar el API.
 */
export function useClientPortalClientOptions() {
  const apiFetch = useApiFetch();

  const { data, asyncStatus, error, refresh } = useQuery({
    key: [CLIENT_PORTAL_CLIENTS_DROPDOWN_QUERY_KEY],
    staleTime: Number.POSITIVE_INFINITY,
    query: async ({ signal }) => {
      const rows: ClientPortalDropdownApiRow[] = [];
      let cursor: string | null = null;
      do {
        const page: PaginatedResponse<ClientPortalDropdownApiRow> =
          await apiFetch<PaginatedResponse<ClientPortalDropdownApiRow>>(
            CLIENT_PORTAL_CLIENTS_DROPDOWN_PATH,
            { query: buildPaginatedQuery(undefined, cursor), signal },
          );
        rows.push(...page.results);
        cursor = extractCursorFromPaginatedNext(page.next);
      } while (cursor);
      return mapClientPortalDropdownRows(rows);
    },
  });

  const options = computed(() => data.value ?? []);
  const isLoading = computed(
    () => asyncStatus.value === 'loading' && data.value == null,
  );
  const isError = computed(() => error.value != null);
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return { options, isLoading, isError, errorMessage, refresh };
}
