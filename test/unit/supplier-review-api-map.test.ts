import { describe, expect, it } from 'vitest';
import type { RescueSupplierRatingRow } from '~/interfaces/rescue/operative';
import { supplierReviewSchema } from '~/schemas/catalog-create';
import { rescueServiceCompletedSchema } from '~/schemas/rescue-operative';
import {
  buildSupplierReviewComment,
  hasSupplierReviewCommentary,
} from '~/utils/supplier-review-commentary';
import {
  getRatedSuppliers,
  toStandaloneSupplierReviewBody,
  toSupplierReviewCreateBody,
} from '~/utils/supplier-review-api-map';

function ratingRow(
  partial: Partial<RescueSupplierRatingRow> = {},
): RescueSupplierRatingRow {
  return {
    supplier_id: 42,
    supplier_name: 'Proveedor Test',
    score: 4,
    selectedChips: ['Buena atención'],
    freeComment: '',
    ...partial,
  };
}

describe('buildSupplierReviewComment', () => {
  it('joins chips and free comment with " - "', () => {
    expect(
      buildSupplierReviewComment(
        ['Excelente atención', 'Resolvieron todo rápido'],
        'Mi comentario libre',
      ),
    ).toBe('Excelente atención - Resolvieron todo rápido - Mi comentario libre');
  });

  it('returns only chips when free comment is empty', () => {
    expect(buildSupplierReviewComment(['Buena atención'], '')).toBe(
      'Buena atención',
    );
  });

  it('returns only free comment when no chips selected', () => {
    expect(buildSupplierReviewComment([], 'Solo texto libre')).toBe(
      'Solo texto libre',
    );
  });

  it('returns empty string when both are empty', () => {
    expect(buildSupplierReviewComment([], '   ')).toBe('');
  });
});

describe('hasSupplierReviewCommentary', () => {
  it('is true when chips or free comment exist', () => {
    expect(hasSupplierReviewCommentary(['Chip'], '')).toBe(true);
    expect(hasSupplierReviewCommentary([], 'Texto')).toBe(true);
    expect(hasSupplierReviewCommentary([], '   ')).toBe(false);
  });
});

describe('getRatedSuppliers', () => {
  it('returns only rows with score >= 1', () => {
    const rows = [
      ratingRow({ supplier_id: 1, score: 5 }),
      ratingRow({ supplier_id: 2, score: 0 }),
      ratingRow({ supplier_id: 3, score: 3 }),
    ];

    expect(getRatedSuppliers(rows)).toEqual([rows[0], rows[2]]);
  });
});

describe('toStandaloneSupplierReviewBody', () => {
  it('maps rating and built comment from chips and free text', () => {
    expect(
      toStandaloneSupplierReviewBody(
        5,
        ['Excelente atención', 'Resolvieron todo rápido'],
        'Gracias',
      ),
    ).toEqual({
      rating: 5,
      comment: 'Excelente atención - Resolvieron todo rápido - Gracias',
    });
  });

  it('maps chips-only comment', () => {
    expect(
      toStandaloneSupplierReviewBody(4, ['Buena atención'], ''),
    ).toEqual({
      rating: 4,
      comment: 'Buena atención',
    });
  });

  it('maps free-text-only comment', () => {
    expect(
      toStandaloneSupplierReviewBody(4, [], 'Excelente servicio'),
    ).toEqual({
      rating: 4,
      comment: 'Excelente servicio',
    });
  });

  it('omits comment when empty', () => {
    expect(toStandaloneSupplierReviewBody(4, [], '   ')).toEqual({
      rating: 4,
    });
  });
});

describe('toSupplierReviewCreateBody', () => {
  it('maps score to rating and includes rescue_id', () => {
    expect(toSupplierReviewCreateBody(ratingRow({ score: 5 }), 123)).toEqual({
      rating: 5,
      comment: 'Buena atención',
      rescue_id: 123,
    });
  });

  it('builds comment from chips and free text', () => {
    expect(
      toSupplierReviewCreateBody(
        ratingRow({
          selectedChips: ['Buena atención'],
          freeComment: 'Muy puntual',
        }),
        123,
      ),
    ).toEqual({
      rating: 4,
      comment: 'Buena atención - Muy puntual',
      rescue_id: 123,
    });
  });

  it('omits comment when empty', () => {
    expect(
      toSupplierReviewCreateBody(
        ratingRow({ selectedChips: [], freeComment: '   ' }),
        123,
      ),
    ).toEqual({
      rating: 4,
      rescue_id: 123,
    });
  });
});

describe('supplierReviewSchema', () => {
  it('rejects when neither chips nor free comment are provided', () => {
    const result = supplierReviewSchema.safeParse({
      rating: 5,
      selectedChips: [],
      freeComment: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts chips only', () => {
    const result = supplierReviewSchema.safeParse({
      rating: 5,
      selectedChips: ['Excelente atención'],
      freeComment: '',
    });
    expect(result.success).toBe(true);
  });

  it('accepts free comment only', () => {
    const result = supplierReviewSchema.safeParse({
      rating: 4,
      selectedChips: [],
      freeComment: 'Todo bien',
    });
    expect(result.success).toBe(true);
  });

  it('accepts chips and free comment together', () => {
    const result = supplierReviewSchema.safeParse({
      rating: 4,
      selectedChips: ['Buena atención'],
      freeComment: 'Extra',
    });
    expect(result.success).toBe(true);
  });
});

describe('rescueServiceCompletedSchema ratings', () => {
  const base = {
    close_date: '2026-07-01',
    disbursement_date: '',
    is_loan: false,
  };

  it('rejects rated row without chips or free comment', () => {
    const result = rescueServiceCompletedSchema.safeParse({
      ...base,
      ratings: [
        {
          supplier_id: 1,
          supplier_name: 'Proveedor',
          score: 5,
          selectedChips: [],
          freeComment: '',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('accepts rated row with chips only', () => {
    const result = rescueServiceCompletedSchema.safeParse({
      ...base,
      ratings: [
        {
          supplier_id: 1,
          supplier_name: 'Proveedor',
          score: 5,
          selectedChips: ['Excelente atención'],
          freeComment: '',
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
