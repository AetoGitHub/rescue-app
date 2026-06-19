import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_REVERT_CANCELLATION_PATH } from '~/constants/rescue-operative-flow';
import type { RescueRevertCancellationBody } from '~/interfaces/rescue/operative';

export function useRescueRevertCancellation(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (body: RescueRevertCancellationBody) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }

      return apiFetch(RESCUE_REVERT_CANCELLATION_PATH(currentId), {
        method: 'POST',
        body,
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
        key: ['operational-rescue-cards-summary'],
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo revertir la cancelación',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const isReverting = computed(() => asyncStatus.value === 'loading');

  return {
    revertCancellation: mutateAsync,
    isReverting,
  };
}
