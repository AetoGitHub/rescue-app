import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_UPDATE_PATH } from '~/constants/rescue-api';
import type { RescueServiceUpdateBody } from '~/schemas/rescue-service-update';

export function useRescueServiceUpdate(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  async function invalidateServiceQueries() {
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
  }

  const { mutateAsync: updateService, asyncStatus } = useMutation({
    mutation: (body: RescueServiceUpdateBody) =>
      apiFetch(RESCUE_UPDATE_PATH(id.value as number), {
        method: 'PUT',
        body,
      }),
    onSuccess: invalidateServiceQueries,
  });

  const isUpdating = computed(() => asyncStatus.value === 'loading');

  async function saveService(body: RescueServiceUpdateBody) {
    if (id.value == null) return false;

    try {
      await updateService(body);
      toast.add({
        title: 'Servicio actualizado',
        color: 'success',
      });
      return true;
    } catch (error) {
      toast.add({
        title: 'No se pudo actualizar el servicio',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    }
  }

  return {
    saveService,
    isUpdating,
  };
}
