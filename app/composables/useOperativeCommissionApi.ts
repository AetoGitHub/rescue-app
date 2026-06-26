import { useMutation, useQueryCache } from '@pinia/colada';
import type {
  OperativeCommissionBulkItem,
  OperativeCommissionOperator,
} from '~/interfaces/auth/operative-commission';
import {
  OPERATIVE_COMMISSION_BULK_PATH,
  OPERATIVE_COMMISSION_LIST_PATH,
  OPERATIVE_COMMISSION_UPDATE_PATH,
} from '~/constants/operative-commission';
import { formatOperativeCommissionForApi } from '~/utils/operative-commission-map';

export function useOperativeCommissionList() {
  return useCatalogInfiniteList<Record<string, unknown>>({
    key: () => ['operative-commission'],
    path: OPERATIVE_COMMISSION_LIST_PATH,
  });
}

export function useOperativeCommissionApi() {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: ({
      operatorId,
      commission,
    }: {
      operatorId: number;
      commission: string;
    }) =>
      apiFetch(OPERATIVE_COMMISSION_UPDATE_PATH(operatorId), {
        method: 'PUT',
        body: { commission: formatOperativeCommissionForApi(commission) },
      }),
    onSuccess: async () => {
      await queryCache.invalidateQueries({ key: ['operative-commission'] });
      toast.add({
        title: 'Comisión guardada',
        color: 'success',
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo guardar la comisión',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  async function updateCommission(operatorId: number, commission: string) {
    await mutateAsync({ operatorId, commission });
  }

  async function updateCommissionBulk(items: OperativeCommissionBulkItem[]) {
    await apiFetch(OPERATIVE_COMMISSION_BULK_PATH, {
      method: 'PUT',
      body: items.map((item) => ({
        id: item.id,
        commission: formatOperativeCommissionForApi(item.commission),
      })),
    });
    await queryCache.invalidateQueries({ key: ['operative-commission'] });
  }

  const isUpdating = computed(() => asyncStatus.value === 'loading');

  return {
    updateCommission,
    updateCommissionBulk,
    isUpdating,
  };
}

export function mapOperativeCommissionRows(
  rows: Record<string, unknown>[],
): OperativeCommissionOperator[] {
  return rows.map(mapOperativeCommissionRow);
}
