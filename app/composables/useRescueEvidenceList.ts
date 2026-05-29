import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_EVIDENCE_LIST_PATH } from '~/constants/rescue-evidence-api';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';

export function useRescueEvidenceList(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const id = computed(() => toValue(rescueId));

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['rescue-evidence', id.value ?? ''],
    enabled: () => id.value != null,
    query: async ({ signal }) => {
      const raw = await apiFetch<unknown>(RESCUE_EVIDENCE_LIST_PATH(id.value!), {
        signal,
      });
      return mapRescueEvidenceListFromApi(raw);
    },
    refetchOnWindowFocus: false,
  });

  const evidences = computed((): RescueEvidence[] => data.value ?? []);
  const isPending = computed(() => asyncStatus.value === 'loading');
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    evidences,
    isPending,
    errorMessage,
    refresh,
  };
}
