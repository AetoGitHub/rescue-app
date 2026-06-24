import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_ADMIN_DOC_PATH } from '~/constants/rescue-admin-doc-api';
import type { RescueAdminDocBody } from '~/schemas/rescue-admin-doc';

async function invalidateAdministrativeBoardQueries(
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

export function useRescueAdminDoc(rescueId: MaybeRefOrGetter<number | null>) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync: saveAdminDoc, asyncStatus } = useMutation({
    mutation: (body: RescueAdminDocBody) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }
      return apiFetch(RESCUE_ADMIN_DOC_PATH(currentId), {
        method: 'POST',
        body,
      });
    },
    onSuccess: async () => {
      await invalidateAdministrativeBoardQueries(queryCache, id.value);
    },
  });

  const isSaving = computed(() => asyncStatus.value === 'loading');

  async function save(
    body: RescueAdminDocBody,
    options?: { silent?: boolean },
  ) {
    if (id.value == null) return false;

    try {
      await saveAdminDoc(body);
      if (!options?.silent) {
        toast.add({
          title: 'Documentos registrados',
          color: 'success',
        });
      }
      return true;
    } catch (error) {
      toast.add({
        title: 'No se pudieron registrar los documentos',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    }
  }

  return {
    save,
    isSaving,
  };
}
