import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_QUOTE_DETAIL_PATH } from '~/constants/rescue-quote-api';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { isRescueQuoteNotFoundError } from '~/utils/rescue-quote-not-found';

export function useRescueQuoteDetail(
  rescueId: MaybeRefOrGetter<number | null>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const apiFetch = useApiFetch();
  const id = computed(() => toValue(rescueId));
  const enabledRef = computed(() => {
    if (id.value == null) return false;
    const extra = options?.enabled;
    if (extra == null) return true;
    return toValue(extra);
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['rescue-quote-detail', id.value ?? ''],
    enabled: () => enabledRef.value,
    query: async ({ signal }) => {
      try {
        return await apiFetch<RescueQuoteDetail>(
          RESCUE_QUOTE_DETAIL_PATH(id.value as number),
          { signal },
        );
      } catch (fetchError) {
        if (isRescueQuoteNotFoundError(fetchError)) {
          return null;
        }
        throw fetchError;
      }
    },
    refetchOnWindowFocus: false,
  });

  const quoteDetail = computed(() => data.value ?? null);
  const isPending = computed(() => asyncStatus.value === 'loading');
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    quoteDetail,
    isPending,
    error,
    errorMessage,
    refresh,
  };
}
