import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { creditUnlockCompanyListPath } from '~/constants/client-credit-api';
import type { CreditTemporaryUnlock } from '~/interfaces/catalogs/credit';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { mapCreditTemporaryUnlock } from '~/utils/catalog-detail-map';

export type CreditUnlockActiveFilter = 'active' | 'inactive' | 'all';

function activeFilterQuery(
  filter: CreditUnlockActiveFilter,
): Record<string, string> | undefined {
  if (filter === 'active') return { active: 'true' };
  if (filter === 'inactive') return { active: 'false' };
  return undefined;
}

/**
 * Company-wide credit unlock list (`GET /api/credit/unlock/company/{companyId}/`).
 */
export function useCreditUnlockList(options: {
  companyId: MaybeRefOrGetter<number | null>;
  creditId?: MaybeRefOrGetter<number | null>;
  activeFilter?: MaybeRefOrGetter<CreditUnlockActiveFilter>;
  enabled?: MaybeRefOrGetter<boolean>;
}) {
  const apiFetch = useApiFetch();
  const companyId = computed(() => toValue(options.companyId));
  const creditId = computed(() => toValue(options.creditId ?? null));
  const activeFilter = computed(
    () => toValue(options.activeFilter) ?? 'active',
  );

  const enabledRef = computed(() => {
    if (companyId.value == null) return false;
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
    PaginatedResponse<CreditTemporaryUnlock>,
    Error,
    string | null
  >({
    key: () => [
      'credit-unlock-company',
      companyId.value ?? '',
      activeFilter.value,
    ],
    enabled: () => enabledRef.value,
    initialPageParam: null,
    query: async ({ pageParam, signal }) => {
      const id = companyId.value as number;
      const filterQuery = activeFilterQuery(activeFilter.value);
      const raw = await apiFetch<PaginatedResponse<Record<string, unknown>>>(
        creditUnlockCompanyListPath(id),
        {
          query: buildPaginatedQuery(filterQuery, pageParam),
          signal,
        },
      );

      return {
        next: raw.next,
        previous: raw.previous,
        results: (raw.results ?? []).map(mapCreditTemporaryUnlock),
      };
    },
    getNextPageParam: getNextCursorPageParam,
    refetchOnWindowFocus: false,
  });

  const allRows = computed(() =>
    flattenPaginatedPages<CreditTemporaryUnlock>(data.value?.pages),
  );

  const rows = computed(() => {
    const targetCreditId = creditId.value;
    if (targetCreditId == null) return allRows.value;
    return allRows.value.filter((row) => row.credit_id === targetCreditId);
  });

  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && rows.value.length === 0,
  );

  return {
    rows,
    allRows,
    hasNextPage,
    loadNextPage,
    isInitialLoading,
    asyncStatus,
    refresh,
  };
}
