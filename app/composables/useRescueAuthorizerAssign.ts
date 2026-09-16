import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_AUTHORIZER_ASSIGN_PATH } from '~/constants/rescue-authorizer-api';
import type { RescueAuthorizerAssignBody } from '~/schemas/rescue-authorizer-assign';

export function useRescueAuthorizerAssign(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  async function invalidateAuthorizerQueries() {
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

  const { mutateAsync: assignAuthorizer, asyncStatus } = useMutation({
    mutation: (body: RescueAuthorizerAssignBody) =>
      apiFetch(RESCUE_AUTHORIZER_ASSIGN_PATH(id.value as number), {
        method: 'PUT',
        body,
      }),
    onSuccess: invalidateAuthorizerQueries,
  });

  const assignmentLocked = ref(false);
  const isAssigning = computed(
    () => assignmentLocked.value || asyncStatus.value === 'loading',
  );

  async function saveAuthorizer(body: RescueAuthorizerAssignBody) {
    if (id.value == null || isAssigning.value) return false;
    assignmentLocked.value = true;

    try {
      await assignAuthorizer(body);
      toast.add({
        title: body.authorizer == null
          ? 'Autorizador removido'
          : 'Autorizador asignado',
        color: 'success',
      });
      return true;
    } catch (error) {
      toast.add({
        title: 'No se pudo actualizar el autorizador',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    } finally {
      assignmentLocked.value = false;
    }
  }

  return {
    saveAuthorizer,
    isAssigning,
  };
}
