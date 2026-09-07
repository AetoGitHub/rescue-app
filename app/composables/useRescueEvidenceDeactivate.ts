import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  RESCUE_EVIDENCE_DEACTIVATE_PATH,
  RESCUE_EVIDENCE_MODAL_COPY,
} from '~/constants/rescue-evidence-api';

export function useRescueEvidenceDeactivate(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const toast = useToast();
  const queryCache = useQueryCache();
  const id = computed(() => toValue(rescueId));
  const copy = RESCUE_EVIDENCE_MODAL_COPY.preview;

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (evidenceId: number) =>
      apiFetch(RESCUE_EVIDENCE_DEACTIVATE_PATH(evidenceId), {
        method: 'POST',
      }),
    onSuccess: async () => {
      const currentId = id.value;
      if (currentId != null) {
        await queryCache.invalidateQueries({
          key: ['rescue-evidence', currentId],
        });
      }
    },
  });

  const deactivatingId = ref<number | null>(null);
  const isDeactivatingAny = computed(
    () => deactivatingId.value != null || asyncStatus.value === 'loading',
  );

  function isDeactivating(evidenceId: number) {
    return deactivatingId.value === evidenceId;
  }

  async function deactivateEvidence(evidenceId: number): Promise<boolean> {
    if (isDeactivatingAny.value) return false;
    deactivatingId.value = evidenceId;
    try {
      await mutateAsync(evidenceId);
      toast.add({ title: copy.deleteSuccess, color: 'success' });
      return true;
    } catch (error) {
      toast.add({
        title: copy.deleteError,
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    } finally {
      deactivatingId.value = null;
    }
  }

  return {
    deactivateEvidence,
    isDeactivating,
    isDeactivatingAny,
  };
}
