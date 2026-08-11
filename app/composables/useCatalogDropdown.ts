import { useInfiniteQuery, useQuery } from '@pinia/colada';
import { watchDebounced } from '@vueuse/core';
import type { AsyncStatus } from '@pinia/colada';
import type { ComputedRef, Ref } from 'vue';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export type CatalogDropdownFetchOptions = {
  signal?: AbortSignal;
  start?: string | null;
  cursor?: string | null;
};

export type CatalogDropdownFetcher = (
  search: string,
  options?: CatalogDropdownFetchOptions,
) => Promise<PaginatedResponse<CatalogDropdownRow>>;

export type CatalogDropdownInfiniteMode = 'offset' | 'cursor';

interface CatalogDropdownStateBase {
  searchTerm: Ref<string>;
  items: ComputedRef<CatalogDropdownRow[]>;
  loading: ComputedRef<boolean>;
  loadingMore: ComputedRef<boolean>;
  errorMessage: ComputedRef<string>;
  infinite: boolean;
}

interface CatalogDropdownSingleState extends CatalogDropdownStateBase {
  infinite: false;
  hasNextPage: ComputedRef<boolean>;
  loadNextPage: () => void;
  asyncStatus: ComputedRef<AsyncStatus>;
}

interface CatalogDropdownInfiniteState extends CatalogDropdownStateBase {
  infinite: true;
  hasNextPage: ComputedRef<boolean>;
  loadNextPage: () => Promise<unknown>;
  asyncStatus: Ref<AsyncStatus>;
}

export type CatalogDropdownState =
  | CatalogDropdownSingleState
  | CatalogDropdownInfiniteState;

function useDebouncedSearch() {
  const searchTerm = ref('');
  const debouncedSearch = ref('');

  watchDebounced(
    searchTerm,
    (term) => {
      debouncedSearch.value = term;
    },
    { debounce: 300, immediate: true },
  );

  return { searchTerm, debouncedSearch };
}

function useCatalogDropdownInfinite(
  fetcher: CatalogDropdownFetcher,
  infiniteMode: CatalogDropdownInfiniteMode,
  requireSearch: boolean,
): CatalogDropdownInfiniteState {
  const instanceId = useId();
  const { searchTerm, debouncedSearch } = useDebouncedSearch();

  const searchEnabled = computed(
    () => !requireSearch || debouncedSearch.value.trim().length > 0,
  );

  const getNextPageParam =
    infiniteMode === 'offset'
      ? getNextOffsetPageParam
      : getNextCursorPageParam;

  const {
    data,
    asyncStatus,
    hasNextPage: queryHasNextPage,
    loadNextPage,
    error,
  } = useInfiniteQuery<PaginatedResponse<CatalogDropdownRow>, Error, string | null>({
    key: () => ['catalog-dropdown', instanceId, infiniteMode, debouncedSearch.value],
    initialPageParam: null,
    enabled: () => searchEnabled.value,
    query: ({ pageParam, signal }) =>
      fetcher(debouncedSearch.value, {
        signal,
        start: infiniteMode === 'offset' ? pageParam : undefined,
        cursor: infiniteMode === 'cursor' ? pageParam : undefined,
      }),
    getNextPageParam,
  });

  const items = computed(() =>
    searchEnabled.value
      ? flattenPaginatedPages(data.value?.pages)
      : [],
  );
  const loading = computed(
    () =>
      searchEnabled.value
      && asyncStatus.value === 'loading'
      && items.value.length === 0,
  );
  const loadingMore = computed(
    () => asyncStatus.value === 'loading' && items.value.length > 0,
  );
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );
  const hasNextPage = computed(
    () => searchEnabled.value && Boolean(queryHasNextPage.value),
  );

  return {
    searchTerm,
    items,
    loading,
    loadingMore,
    errorMessage,
    infinite: true,
    hasNextPage,
    loadNextPage,
    asyncStatus,
  };
}

function useCatalogDropdownSingle(
  fetcher: CatalogDropdownFetcher,
  requireSearch: boolean,
): CatalogDropdownSingleState {
  const instanceId = useId();
  const { searchTerm, debouncedSearch } = useDebouncedSearch();

  const searchEnabled = computed(
    () => !requireSearch || debouncedSearch.value.trim().length > 0,
  );

  const { data, asyncStatus: queryAsyncStatus, error } = useQuery({
    key: () => ['catalog-dropdown', instanceId, debouncedSearch.value],
    query: async ({ signal }) => fetcher(debouncedSearch.value, { signal }),
    enabled: () => searchEnabled.value,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const items = computed(() =>
    searchEnabled.value ? (data.value?.results ?? []) : [],
  );
  const loading = computed(
    () => searchEnabled.value && queryAsyncStatus.value === 'loading',
  );
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    searchTerm,
    items,
    loading,
    loadingMore: computed(() => false),
    errorMessage,
    infinite: false,
    hasNextPage: computed(() => false),
    loadNextPage: () => {},
    asyncStatus: computed(() => queryAsyncStatus.value),
  };
}

export function useCatalogDropdown(
  fetcher: CatalogDropdownFetcher,
  options?: {
    infinite?: CatalogDropdownInfiniteMode;
    requireSearch?: boolean;
  },
): CatalogDropdownState {
  const requireSearch = options?.requireSearch === true;
  if (options?.infinite) {
    return useCatalogDropdownInfinite(fetcher, options.infinite, requireSearch);
  }
  return useCatalogDropdownSingle(fetcher, requireSearch);
}
