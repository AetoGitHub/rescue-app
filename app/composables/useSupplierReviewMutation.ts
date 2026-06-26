import { useMutation, useQueryCache } from '@pinia/colada';
import type { SupplierReviewCreateBody } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierRatingRow } from '~/interfaces/rescue/operative';
import { SUPPLIER_REVIEW_CREATE_PATH } from '~/constants/rescue-api';
import {
  getRatedSuppliers,
  toStandaloneSupplierReviewBody,
  toSupplierReviewCreateBody,
} from '~/utils/supplier-review-api-map';

export function useSupplierReviewMutation() {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
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
    onSuccess: async () => {
      await queryCache.invalidateQueries({ key: ['suppliers'] });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo guardar la calificación del proveedor',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  async function createReview(
    supplierId: number,
    input: { rating: number; comment: string },
  ) {
    await mutateAsync({
      supplierId,
      body: toStandaloneSupplierReviewBody(input.rating, input.comment),
    });
    toast.add({
      title: 'Calificación guardada',
      color: 'success',
    });
  }

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
    createReview,
    createReviewsForRescue,
    isCreating,
  };
}
