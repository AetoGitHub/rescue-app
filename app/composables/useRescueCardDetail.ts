import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import type { RescueCardDetail } from '~/interfaces/rescue';

export function useRescueCardDetail(rescueId: MaybeRefOrGetter<number | null>) {
  const apiFetch = useApiFetch();
  const id = computed(() => toValue(rescueId));

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['rescue-card-detail', id.value ?? ''],
    enabled: () => id.value != null,
    query: async ({ signal }) => {
      const raw = await apiFetch<RescueCardDetail>(`/api/rescue/cards/${id.value}/`, {
        signal,
      });
      return mapRescueCardDetailFromApi(raw);
    },
    refetchOnWindowFocus: false,
  });

  const detail = computed(() => data.value ?? null);
  const isPending = computed(() => asyncStatus.value === 'loading');
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    detail,
    isPending,
    error,
    errorMessage,
    refresh,
  };
}
