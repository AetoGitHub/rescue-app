import type { SupplierReviewCreateBody } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierRatingRow } from '~/interfaces/rescue/operative';

export function getRatedSuppliers(
  rows: RescueSupplierRatingRow[],
): RescueSupplierRatingRow[] {
  return rows.filter((r) => r.score >= 1);
}

export function toStandaloneSupplierReviewBody(
  rating: number,
  comment: string,
): SupplierReviewCreateBody {
  return {
    rating,
    comment: comment.trim() || undefined,
  };
}

export function toSupplierReviewCreateBody(
  row: RescueSupplierRatingRow,
  rescueId?: number,
): SupplierReviewCreateBody {
  const body: SupplierReviewCreateBody = {
    rating: row.score,
    comment: row.comment.trim() || undefined,
  };
  if (rescueId != null) {
    body.rescue_id = rescueId;
  }
  return body;
}
