import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_CARDS_SUMMARY_PATH } from '~/constants/rescue-cards-summary';
import type { OperationalRescueStatus } from '~/constants/operational-kanban';
import type { OperationalBoardFilters } from '~/interfaces/operational/board-filters';
import type { OperationalRescueCardsSummary } from '~/interfaces/rescue/cards-summary';

export function useOperationalRescueCardsSummary(
  status: MaybeRefOrGetter<OperationalRescueStatus>,
  filters: MaybeRefOrGetter<OperationalBoardFilters>,
) {
  const apiFetch = useApiFetch();
  const statusValue = computed(() => toValue(status));
  const filtersValue = computed(() => toValue(filters));
  const queryParams = computed(() =>
    buildOperationalCardsQuery(statusValue.value, filtersValue.value),
  );

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      'operational-rescue-cards-summary',
      statusValue.value,
      ...operationalBoardFiltersKey(filtersValue.value),
    ],
    query: ({ signal }) =>
      apiFetch<OperationalRescueCardsSummary>(RESCUE_CARDS_SUMMARY_PATH, {
        query: queryParams.value,
        signal,
      }),
  });

  const subtotal = computed(() => data.value?.subtotal ?? 0);
  const subtotalLabel = computed(() =>
    error.value != null ? '—' : formatRescueCardMoney(subtotal.value),
  );
  const isLoading = computed(() => asyncStatus.value === 'loading');
  const isError = computed(() => error.value != null);

  return {
    data,
    subtotal,
    subtotalLabel,
    isLoading,
    isError,
    refresh,
  };
}
