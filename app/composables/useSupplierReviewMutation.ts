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

  const reviewLocked = ref(false);
  const isCreating = computed(
    () => reviewLocked.value || asyncStatus.value === 'loading',
  );

  async function createReview(
    supplierId: number,
    input: {
      rating: number;
      selectedChips: string[];
      freeComment: string;
    },
  ): Promise<boolean> {
    if (isCreating.value) return false;
    reviewLocked.value = true;
    try {
      await mutateAsync({
        supplierId,
        body: toStandaloneSupplierReviewBody(
          input.rating,
          input.selectedChips,
          input.freeComment,
        ),
      });
      toast.add({
        title: 'Calificación guardada',
        color: 'success',
      });
      return true;
    } finally {
      reviewLocked.value = false;
    }
  }

  async function createReviewsForRescue(
    ratings: RescueSupplierRatingRow[],
    rescueId: number,
  ): Promise<boolean> {
    if (isCreating.value) return false;
    reviewLocked.value = true;
    try {
      const rated = getRatedSuppliers(ratings);
      // Concurrencia intencional: una petición por proveedor calificado.
      await Promise.all(
        rated.map((row) =>
          mutateAsync({
            supplierId: row.supplier_id,
            body: toSupplierReviewCreateBody(row, rescueId),
          }),
        ),
      );
      return true;
    } finally {
      reviewLocked.value = false;
    }
  }

  return {
    createReview,
    createReviewsForRescue,
    isCreating,
  };
}
