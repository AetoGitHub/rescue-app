import { describe, expect, it } from 'vitest';
import type { RescueSupplierRatingRow } from '~/interfaces/rescue/operative';
import {
  getRatedSuppliers,
  toSupplierReviewCreateBody,
} from '~/utils/supplier-review-api-map';

function ratingRow(
  partial: Partial<RescueSupplierRatingRow> = {},
): RescueSupplierRatingRow {
  return {
    supplier_id: 42,
    supplier_name: 'Proveedor Test',
    score: 4,
    comment: 'Buen servicio',
    ...partial,
  };
}

describe('getRatedSuppliers', () => {
  it('returns only rows with score >= 1', () => {
    const rows = [
      ratingRow({ supplier_id: 1, score: 5 }),
      ratingRow({ supplier_id: 2, score: 0 }),
      ratingRow({ supplier_id: 3, score: 3 }),
    ];

    expect(getRatedSuppliers(rows)).toEqual([
      rows[0],
      rows[2],
    ]);
  });
});

describe('toSupplierReviewCreateBody', () => {
  it('maps score to rating and includes rescue_id', () => {
    expect(toSupplierReviewCreateBody(ratingRow({ score: 5 }), 123)).toEqual({
      rating: 5,
      comment: 'Buen servicio',
      rescue_id: 123,
    });
  });

  it('omits comment when empty', () => {
    expect(
      toSupplierReviewCreateBody(ratingRow({ comment: '   ' }), 123),
    ).toEqual({
      rating: 4,
      rescue_id: 123,
    });
  });
});
