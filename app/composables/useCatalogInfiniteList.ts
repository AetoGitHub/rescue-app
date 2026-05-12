import { useInfiniteQuery } from '@pinia/colada';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

interface CatalogInfiniteListOptions<T> {
  key: () => readonly unknown[];
  path: string;
  query?: Record<string, string>;
}

export function useCatalogInfiniteList<T>(options: CatalogInfiniteListOptions<T>) {
  const apiFetch = useApiFetch();

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isPending,
  } = useInfiniteQuery({
    key: options.key,
    initialPageParam: null as string | null,
    query: ({ pageParam }) =>
      pageParam
        ? apiFetch<PaginatedResponse<T>>(pageParam)
        : apiFetch<PaginatedResponse<T>>(options.path, {
            query: options.query,
          }),
    getNextPageParam: getNextPaginatedPageParam,
  });

  const rows = computed(() => flattenPaginatedPages(data.value?.pages));
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
