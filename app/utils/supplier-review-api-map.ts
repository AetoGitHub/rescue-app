import type { SupplierReviewCreateBody } from '~/interfaces/catalogs/supplier';
import type { RescueSupplierRatingRow } from '~/interfaces/rescue/operative';
import { buildSupplierReviewComment } from '~/utils/supplier-review-commentary';

export function getRatedSuppliers(
  rows: RescueSupplierRatingRow[],
): RescueSupplierRatingRow[] {
  return rows.filter((r) => r.score >= 1);
}

export function toStandaloneSupplierReviewBody(
  rating: number,
  selectedChips: string[],
  freeComment: string,
): SupplierReviewCreateBody {
  const comment = buildSupplierReviewComment(selectedChips, freeComment);
  return {
    rating,
    comment: comment || undefined,
  };
}

export function toSupplierReviewCreateBody(
  row: RescueSupplierRatingRow,
  rescueId?: number,
): SupplierReviewCreateBody {
  const comment = buildSupplierReviewComment(row.selectedChips, row.freeComment);
  const body: SupplierReviewCreateBody = {
    rating: row.score,
    comment: comment || undefined,
  };
  if (rescueId != null) {
    body.rescue_id = rescueId;
  }
  return body;
}
