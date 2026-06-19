import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  RESCUE_ADMINISTRATIVE_CHANGE_PHASE_PATH,
  RESCUE_ADMINISTRATIVE_REVERT_CANCELLATION_PATH,
  RESCUE_ADMINISTRATIVE_UPDATE_METHOD,
  RESCUE_CHANGE_ADMIN_STATUS_PATH,
} from '~/constants/rescue-administrative-flow';
import type {
  RescueAdministrativeChangePhaseBody,
  RescueAdministrativeRevertCancellationBody,
} from '~/interfaces/rescue/administrative';
import {
  isAdministrativePhaseChange,
  mapAdministrativeChangeAdminStatusToApi,
  mapAdministrativeLegacyUpdateToApi,
} from '~/utils/rescue-administrative-api-map';

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

      if (isAdministrativePhaseChange(body)) {
        return apiFetch(RESCUE_CHANGE_ADMIN_STATUS_PATH(currentId), {
          method: RESCUE_ADMINISTRATIVE_UPDATE_METHOD,
          body: mapAdministrativeChangeAdminStatusToApi(body),
        });
      }

      return apiFetch(RESCUE_ADMINISTRATIVE_CHANGE_PHASE_PATH(currentId), {
        method: RESCUE_ADMINISTRATIVE_UPDATE_METHOD,
        body: mapAdministrativeLegacyUpdateToApi(body),
      });
    },
    onSuccess: async () => {
      await invalidateAdministrativeQueries(queryCache, id.value);
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo actualizar la solicitud',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const { mutateAsync: revertAsync, asyncStatus: revertStatus } = useMutation({
    mutation: (body: RescueAdministrativeRevertCancellationBody) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }

      return apiFetch(RESCUE_ADMINISTRATIVE_REVERT_CANCELLATION_PATH(currentId), {
        method: RESCUE_ADMINISTRATIVE_UPDATE_METHOD,
        body,
      });
    },
    onSuccess: async () => {
      await invalidateAdministrativeQueries(queryCache, id.value);
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo revertir la cancelación',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const isUpdating = computed(
    () => asyncStatus.value === 'loading' || revertStatus.value === 'loading',
  );

  return {
    updateAdministrative: mutateAsync,
    revertAdministrativeCancellation: revertAsync,
    isUpdating,
  };
}
