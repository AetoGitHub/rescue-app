import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import type { AdministrativeBillingStatus } from '~/constants/administrative-kanban';
import { RESCUE_ADMINISTRATIVE_CARDS_SUMMARY_PATH } from '~/constants/rescue-cards-summary';
import type { AdministrativeBoardFilters } from '~/interfaces/administrative/board-filters';
import type { AdministrativeRescueCardsSummary } from '~/interfaces/rescue/cards-summary';

export function useAdministrativeRescueCardsSummary(
  billingStatus: MaybeRefOrGetter<AdministrativeBillingStatus>,
  filters: MaybeRefOrGetter<AdministrativeBoardFilters>,
) {
  const apiFetch = useApiFetch();
  const statusValue = computed(() => toValue(billingStatus));
  const filtersValue = computed(() => toValue(filters));
  const queryParams = computed(() =>
    buildAdministrativeCardsQuery(statusValue.value, filtersValue.value),
  );

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      'administrative-rescue-cards-summary',
      statusValue.value,
      ...administrativeCardsApiFiltersKey(filtersValue.value, statusValue.value),
    ],
    query: ({ signal }) =>
      apiFetch<AdministrativeRescueCardsSummary>(
        RESCUE_ADMINISTRATIVE_CARDS_SUMMARY_PATH,
        {
          query: queryParams.value,
          signal,
        },
      ),
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
