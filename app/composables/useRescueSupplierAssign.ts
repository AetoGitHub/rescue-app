import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_SUPPLIER_ASSIGN_PATH } from '~/constants/rescue-supplier-api';
import type { RescueSupplierAssignBody } from '~/schemas/rescue-supplier-assign';

export function useRescueSupplierAssign(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  async function invalidateSupplierQueries() {
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

  const { mutateAsync: assignSupplier, asyncStatus } = useMutation({
    mutation: (body: RescueSupplierAssignBody) =>
      apiFetch(RESCUE_SUPPLIER_ASSIGN_PATH(id.value as number), {
        method: 'PUT',
        body,
      }),
    onSuccess: invalidateSupplierQueries,
  });

  const isAssigning = computed(() => asyncStatus.value === 'loading');

  async function saveSupplier(body: RescueSupplierAssignBody) {
    if (id.value == null) return false;

    try {
      await assignSupplier(body);
      toast.add({
        title: body.supplier == null
          ? 'Proveedor removido'
          : 'Proveedor asignado',
        color: 'success',
      });
      return true;
    } catch (error) {
      toast.add({
        title: 'No se pudo actualizar el proveedor',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    }
  }

  return {
    saveSupplier,
    isAssigning,
  };
}
