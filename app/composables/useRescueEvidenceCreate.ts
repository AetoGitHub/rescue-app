import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_EVIDENCE_CREATE_PATH } from '~/constants/rescue-evidence-api';
import type { RescueEvidenceCreateBody } from '~/interfaces/rescue/evidence';

export function useRescueEvidenceCreate(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (body: RescueEvidenceCreateBody) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }
      return apiFetch(RESCUE_EVIDENCE_CREATE_PATH(currentId), {
        method: 'POST',
        body,
      });
    },
    onSuccess: async () => {
      const currentId = id.value;
      if (currentId != null) {
        await queryCache.invalidateQueries({
          key: ['rescue-evidence', currentId],
        });
      }
    },
  });

  const isCreating = computed(() => asyncStatus.value === 'loading');

  return {
    createEvidences: mutateAsync,
    isCreating,
  };
}
