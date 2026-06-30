import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { CLIENT_CONTACTS_LIST_PATH } from '~/constants/client-api';
import type { ClientContact } from '~/interfaces/catalogs/client';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { mapClientContactRow } from '~/utils/client-contact-map';

export function useClientContactsList(options: {
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
  } = useInfiniteQuery<
    PaginatedResponse<Record<string, unknown>>,
    Error,
    string | null
  >({
    key: () => ['client-contacts', clientId.value ?? ''],
    enabled: () => enabledRef.value,
    initialPageParam: null,
    query: async ({ pageParam, signal }) => {
      const id = clientId.value as number;
      return apiFetch<PaginatedResponse<Record<string, unknown>>>(
        CLIENT_CONTACTS_LIST_PATH(id),
        {
          query: buildPaginatedQuery({}, pageParam),
          signal,
        },
      );
    },
    getNextPageParam: getNextCursorPageParam,
  });

  const rows = computed(() =>
    flattenPaginatedPages(data.value?.pages).map(mapClientContactRow),
  );

  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );

  return {
    rows,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    refresh,
    isInitialLoading,
  };
}
