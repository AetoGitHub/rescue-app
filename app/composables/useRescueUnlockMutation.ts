import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  RESCUE_ADMINISTRATIVE_TOAST,
  RESCUE_UNLOCK_CREATE_PATH,
} from '~/constants/rescue-administrative-flow';
import type { RescueUnlockBody } from '~/interfaces/rescue/administrative';

async function invalidateAdministrativeQueries(
  queryCache: ReturnType<typeof useQueryCache>,
  rescueId: number | null,
) {
  if (rescueId != null) {
    await queryCache.invalidateQueries({
      key: ['rescue-administrative-detail', rescueId],
    });
    await queryCache.invalidateQueries({
      key: ['rescue-card-detail', rescueId],
    });
  }
  await queryCache.invalidateQueries({
    key: ['administrative-rescue-cards'],
  });
  await queryCache.invalidateQueries({
    key: ['administrative-rescue-cards-summary'],
  });
  await queryCache.invalidateQueries({
    key: ['administrative-rescue-list'],
  });
}

export function useRescueUnlockMutation(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (body: RescueUnlockBody) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }

      return apiFetch(RESCUE_UNLOCK_CREATE_PATH(currentId), {
        method: 'POST',
        body,
      });
    },
    onSuccess: async () => {
      await invalidateAdministrativeQueries(queryCache, id.value);
      toast.add({
        title: RESCUE_ADMINISTRATIVE_TOAST.unlocked,
        color: 'success',
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo desbloquear el rescate',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  return {
    unlockRescue: mutateAsync,
    isUnlocking: computed(() => asyncStatus.value === 'loading'),
  };
}
