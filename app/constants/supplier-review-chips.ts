export type SupplierReviewRating = 1 | 2 | 3 | 4 | 5;

export interface SupplierReviewRatingConfig {
  label: string;
  chips: readonly string[];
}

export const SUPPLIER_REVIEW_RATING_CONFIG: Record<
  SupplierReviewRating,
  SupplierReviewRatingConfig
> = {
  1: {
    label: 'Muy malo',
    chips: [
      'Servicio muy lento',
      'No resolvieron mi problema',
      'Trato grosero o indiferente',
      'Tuve que esperar demasiado',
      'No cumplió lo prometido',
    ],
  },
  2: {
    label: 'Malo',
    chips: [
      'Atención tardada',
      'Falta de seguimiento',
      'Información poco clara',
      'Proceso confuso',
      'Esperaba más por el precio/tiempo',
    ],
  },
  3: {
    label: 'Regular',
    chips: [
      'Cumplió lo básico',
      'Podría ser más rápido',
      'Atención aceptable',
      'Faltó comunicación',
      'Ni bueno ni malo',
    ],
  },
  4: {
    label: 'Bueno',
    chips: [
      'Buena atención',
      'Resolvieron mi duda/problema',
      'Tiempo de respuesta adecuado',
      'Personal amable',
      'Cumplió lo esperado',
    ],
  },
  5: {
    label: 'Excelente',
    chips: [
      'Excelente atención',
      'Resolvieron todo rápido',
      'Muy amables y profesionales',
      'Superó mis expectativas',
      'Lo recomendaría sin duda',
    ],
  },
};

export function getSupplierReviewChipsForRating(
  rating: number,
): readonly string[] {
  if (rating < 1 || rating > 5) return [];
  return SUPPLIER_REVIEW_RATING_CONFIG[rating as SupplierReviewRating].chips;
}

export function getSupplierReviewRatingLabel(rating: number): string | null {
  if (rating < 1 || rating > 5) return null;
  return SUPPLIER_REVIEW_RATING_CONFIG[rating as SupplierReviewRating].label;
}
