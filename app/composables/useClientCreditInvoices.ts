import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { clientCreditInvoicesPath } from '~/constants/client-credit-api';
import type { ClientCreditInvoice } from '~/interfaces/catalogs/credit';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { mapClientCreditInvoice } from '~/utils/catalog-detail-map';
import { isClientCreditNotFoundError } from '~/utils/client-credit-not-found';

const emptyPage = (): PaginatedResponse<ClientCreditInvoice> => ({
  next: null,
  previous: null,
  results: [],
});

/**
 * Pending invoices for a client (`GET /api/credit/client/{clientId}/invoices/`).
 */
export function useClientCreditInvoices(options: {
  clientId: MaybeRefOrGetter<number | null>;
  enabled?: MaybeRefOrGetter<boolean>;
}) {
  const apiFetch = useApiFetch();
  const clientId = computed(() => toValue(options.clientId));

  const enabledRef = computed(() => {
    if (clientId.value == null) return false;
    const extra = options.enabled;
    if (extra == null) return true;
    return toValue(extra);
  });

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<ClientCreditInvoice>, Error, string | null>({
    key: () => ['client-credit-invoices', clientId.value ?? ''],
    enabled: () => enabledRef.value,
    initialPageParam: null,
    query: async ({ pageParam, signal }) => {
      const id = clientId.value as number;
      try {
        const raw = await apiFetch<PaginatedResponse<Record<string, unknown>>>(
          clientCreditInvoicesPath(id),
          {
            query: buildPaginatedQuery(undefined, pageParam),
            signal,
          },
        );
        return {
          next: raw.next,
          previous: raw.previous,
          results: (raw.results ?? []).map(mapClientCreditInvoice),
        };
      } catch (fetchError) {
        if (isClientCreditNotFoundError(fetchError)) {
          return emptyPage();
        }
        throw fetchError;
      }
    },
    getNextPageParam: getNextCursorPageParam,
    refetchOnWindowFocus: false,
  });

  const rows = computed(() =>
    flattenPaginatedPages<ClientCreditInvoice>(data.value?.pages),
  );
  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );

  return {
    rows,
    hasNextPage,
    loadNextPage,
    isInitialLoading,
    asyncStatus,
    refresh,
  };
}
