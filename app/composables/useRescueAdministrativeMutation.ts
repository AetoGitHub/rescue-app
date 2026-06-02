import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  RESCUE_ADMINISTRATIVE_CHANGE_PHASE_PATH,
  RESCUE_ADMINISTRATIVE_UPDATE_METHOD,
} from '~/constants/rescue-administrative-flow';
import type { RescueAdministrativeChangePhaseBody } from '~/interfaces/rescue/administrative';
import { mapAdministrativeUpdateToApi } from '~/utils/rescue-administrative-api-map';

export function useRescueAdministrativeMutation(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (body: RescueAdministrativeChangePhaseBody) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }

      return apiFetch(RESCUE_ADMINISTRATIVE_CHANGE_PHASE_PATH(currentId), {
        method: RESCUE_ADMINISTRATIVE_UPDATE_METHOD,
        body: mapAdministrativeUpdateToApi(body),
      });
    },
    onSuccess: async () => {
      const currentId = id.value;
      if (currentId != null) {
        await queryCache.invalidateQueries({
          key: ['rescue-administrative-detail', currentId],
        });
        await queryCache.invalidateQueries({
          key: ['rescue-card-detail', currentId],
        });
      }
      await queryCache.invalidateQueries({
        key: ['administrative-rescue-cards'],
      });
      await queryCache.invalidateQueries({
        key: ['administrative-rescue-list'],
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

  const isUpdating = computed(() => asyncStatus.value === 'loading');

  return {
    updateAdministrative: mutateAsync,
    isUpdating,
  };
}
