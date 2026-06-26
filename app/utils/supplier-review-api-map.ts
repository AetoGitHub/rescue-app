import type { SupplierReviewCreateBody } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierRatingRow } from '~/interfaces/rescue/operative';

export function getRatedSuppliers(
  rows: RescueSupplierRatingRow[],
): RescueSupplierRatingRow[] {
  return rows.filter((r) => r.score >= 1);
}

export function toSupplierReviewCreateBody(
  row: RescueSupplierRatingRow,
  rescueId: number,
): SupplierReviewCreateBody {
  return {
    rating: row.score,
    comment: row.comment.trim() || undefined,
    rescue_id: rescueId,
  };
}
