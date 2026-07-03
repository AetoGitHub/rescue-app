import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_GUEST_APPROVE_PATH } from '~/constants/rescue-approve-link-api';
import type { RescueGuestApproveResponse } from '~/interfaces/rescue/approve-link';

export function useGuestRescueApprove(
  rescueId: MaybeRefOrGetter<number | null>,
  token: MaybeRefOrGetter<string>,
) {
  const toast = useToast();
  const isApproving = ref(false);
  const isApproved = ref(false);
  const errorMessage = ref('');

  async function approve(): Promise<boolean> {
    const currentRescueId = toValue(rescueId);
    const currentToken = toValue(token)?.trim() ?? '';

    if (currentRescueId == null || !currentToken) {
      errorMessage.value = 'Enlace no válido o expirado';
      return false;
    }

    isApproving.value = true;
    errorMessage.value = '';

    try {
      await guestApiFetch<RescueGuestApproveResponse>(
        RESCUE_GUEST_APPROVE_PATH(currentRescueId, currentToken),
        {
          method: 'POST',
          body: {},
        },
      );

      isApproved.value = true;
      toast.add({
        title: 'Rescate aprobado',
        description: 'La autorización se registró correctamente.',
        color: 'success',
      });
      return true;
    } catch (error) {
      errorMessage.value = getFetchErrorMessage(error);
      toast.add({
        title: 'No se pudo aprobar el rescate',
        description: errorMessage.value,
        color: 'error',
      });
      return false;
    } finally {
      isApproving.value = false;
    }
  }

  return {
    approve,
    isApproving: computed(() => isApproving.value),
    isApproved: computed(() => isApproved.value),
    errorMessage: computed(() => errorMessage.value),
  };
}
