import { useMutation } from '@pinia/colada';
import type { SupplierReviewCreateBody } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierRatingRow } from '~/interfaces/rescue/operative';
import { SUPPLIER_REVIEW_CREATE_PATH } from '~/constants/rescue-api';
import {
  getRatedSuppliers,
  toSupplierReviewCreateBody,
} from '~/utils/supplier-review-api-map';

export function useSupplierReviewMutation() {
  const apiFetch = useApiFetch();
  const toast = useToast();

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: ({
      supplierId,
      body,
    }: {
      supplierId: number;
      body: SupplierReviewCreateBody;
    }) =>
      apiFetch(SUPPLIER_REVIEW_CREATE_PATH(supplierId), {
        method: 'POST',
        body,
      }),
    onError: (error) => {
      toast.add({
        title: 'No se pudo guardar la calificación del proveedor',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  async function createReviewsForRescue(
    ratings: RescueSupplierRatingRow[],
    rescueId: number,
  ) {
    const rated = getRatedSuppliers(ratings);
    await Promise.all(
      rated.map((row) =>
        mutateAsync({
          supplierId: row.supplier_id,
          body: toSupplierReviewCreateBody(row, rescueId),
        }),
      ),
    );
  }

  const isCreating = computed(() => asyncStatus.value === 'loading');

  return {
    createReviewsForRescue,
    isCreating,
  };
}
