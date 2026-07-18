import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_UPDATE_PATH } from '~/constants/rescue-api';
import type { RescueLocationUpdateBody } from '~/schemas/rescue-location-update';

export function useRescueLocationUpdate(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  async function invalidateLocationQueries() {
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

  const { mutateAsync: updateLocation, asyncStatus } = useMutation({
    mutation: (body: RescueLocationUpdateBody) =>
      apiFetch(RESCUE_UPDATE_PATH(id.value as number), {
        method: 'PUT',
        body,
      }),
    onSuccess: invalidateLocationQueries,
  });

  const isUpdating = computed(() => asyncStatus.value === 'loading');

  async function saveLocation(body: RescueLocationUpdateBody) {
    if (id.value == null) return false;

    try {
      await updateLocation(body);
      toast.add({
        title: 'Ubicación actualizada',
        color: 'success',
      });
      return true;
    } catch (error) {
      toast.add({
        title: 'No se pudo actualizar la ubicación',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    }
  }

  return {
    saveLocation,
    isUpdating,
  };
}
