import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_CLAIM_PATH } from '~/constants/rescue-operative-flow';

export function useRescueClaimMutation(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: () => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }

      return apiFetch(RESCUE_CLAIM_PATH(currentId), {
        method: 'POST',
      });
    },
    onSuccess: async () => {
      const currentId = id.value;
      if (currentId != null) {
        await queryCache.invalidateQueries({
          key: ['rescue-card-detail', currentId],
        });
      }
      await queryCache.invalidateQueries({
        key: ['operational-rescue-cards'],
      });
      await queryCache.invalidateQueries({
        key: ['operational-rescue-list'],
      });
      await queryCache.invalidateQueries({
        key: ['operational-rescue-cards-summary'],
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo obtener el rescate',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const claimLocked = ref(false);
  const isClaiming = computed(
    () => claimLocked.value || asyncStatus.value === 'loading',
  );

  async function claimRescue() {
    if (isClaiming.value) return;
    claimLocked.value = true;
    try {
      await mutateAsync();
    } finally {
      claimLocked.value = false;
    }
  }

  return {
    claimRescue,
    isClaiming,
  };
}
