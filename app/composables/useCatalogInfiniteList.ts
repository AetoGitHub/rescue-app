import { useInfiniteQuery } from '@pinia/colada';
import type { EntryKey } from '@pinia/colada';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

interface CatalogInfiniteListOptions {
  key: () => EntryKey;
  path: string;
  query?: Record<string, string>;
}

export function useCatalogInfiniteList<T>(options: CatalogInfiniteListOptions) {
  const apiFetch = useApiFetch();

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
  } = useInfiniteQuery<PaginatedResponse<T>, Error, string | null>({
    key: options.key,
    initialPageParam: null,
    query: ({ pageParam }) =>
      pageParam
        ? apiFetch<PaginatedResponse<T>>(pageParam)
        : apiFetch<PaginatedResponse<T>>(options.path, {
            query: options.query,
          }),
    getNextPageParam: getNextPaginatedPageParam,
  });

  const rows = computed(() =>
    flattenPaginatedPages<T>(data.value?.pages),
  );
  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );

  return {
    data,
    rows,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
    isInitialLoading,
  };
}
