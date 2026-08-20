import { useMutation, useQueryCache } from '@pinia/colada';
import type { TmsRescueUpdateBody } from '~/interfaces/portals/tms';
import {
  TMS_RESCUE_LIST_QUERY_KEY,
  TMS_RESCUE_TRIGGER_PATH,
  TMS_RESCUE_UPDATE_PATH,
} from '~/constants/tms-portal-api';

export function useTmsRescueMutations() {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();

  async function invalidateList() {
    await queryCache.invalidateQueries({ key: [...TMS_RESCUE_LIST_QUERY_KEY] });
  }

  const { mutateAsync: updateRescueAsync, asyncStatus: updateStatus } = useMutation({
    mutation: (body: TmsRescueUpdateBody) =>
      apiFetch(TMS_RESCUE_UPDATE_PATH, {
        method: 'POST',
        body,
      }),
    onSuccess: invalidateList,
  });

  const { mutateAsync: triggerAsync, asyncStatus: triggerStatus } = useMutation({
    mutation: () =>
      apiFetch(TMS_RESCUE_TRIGGER_PATH, {
        method: 'POST',
      }),
  });

  const updateLocked = ref(false);
  const triggerLocked = ref(false);
  let updateQueue = Promise.resolve(true);

  const isUpdating = computed(
    () => updateLocked.value || updateStatus.value === 'loading',
  );
  const isTriggering = computed(
    () => triggerLocked.value || triggerStatus.value === 'loading',
  );

  async function updateRescue(body: TmsRescueUpdateBody) {
    const run = async () => {
      updateLocked.value = true;
      try {
        await updateRescueAsync(body);
        toast.add({
          title: 'Rescate actualizado',
          color: 'success',
        });
        return true;
      } catch (error) {
        toast.add({
          title: 'No se pudo actualizar el rescate',
          description: getFetchErrorMessage(error),
          color: 'error',
        });
        return false;
      } finally {
        updateLocked.value = false;
      }
    };

    const next = updateQueue.then(run, run);
    updateQueue = next.then(
      () => true,
      () => true,
    );
    return next;
  }

  async function triggerPortal() {
    if (isTriggering.value) return false;
    triggerLocked.value = true;
    try {
      await triggerAsync();
      toast.add({
        title: 'Proceso disparado',
        color: 'success',
      });
      return true;
    } catch (error) {
      toast.add({
        title: 'No se pudo disparar el proceso',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    } finally {
      triggerLocked.value = false;
    }
  }

  return {
    updateRescue,
    triggerPortal,
    isUpdating,
    isTriggering,
  };
}
