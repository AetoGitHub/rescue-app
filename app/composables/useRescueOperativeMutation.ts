import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  RESCUE_CHANGE_PHASE_PATH,
  RESCUE_OPERATIVE_UPDATE_METHOD,
} from '~/constants/rescue-operative-flow';
import type { RescueChangePhaseBody } from '~/interfaces/rescue/operative';
import { mapOperativeUpdateToApi } from '~/utils/rescue-operative-api-map';

export function useRescueOperativeMutation(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (body: RescueChangePhaseBody) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }

      return apiFetch(RESCUE_CHANGE_PHASE_PATH(currentId), {
        method: RESCUE_OPERATIVE_UPDATE_METHOD,
        body: mapOperativeUpdateToApi(body),
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
        title: 'No se pudo actualizar la solicitud',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const updateLocked = ref(false);
  const isUpdating = computed(
    () => updateLocked.value || asyncStatus.value === 'loading',
  );

  async function updateOperative(body: RescueChangePhaseBody) {
    if (isUpdating.value) return;
    updateLocked.value = true;
    try {
      return await mutateAsync(body);
    } finally {
      updateLocked.value = false;
    }
  }

  return {
    updateOperative,
    isUpdating,
  };
}
