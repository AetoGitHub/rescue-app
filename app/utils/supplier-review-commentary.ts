import type { RefinementCtx } from 'zod';

export function buildSupplierReviewComment(
  selectedChips: string[],
  freeComment: string,
): string {
  return [...selectedChips, freeComment.trim()].filter(Boolean).join(' - ');
}

export function hasSupplierReviewCommentary(
  selectedChips: string[],
  freeComment: string,
): boolean {
  return selectedChips.length > 0 || freeComment.trim().length > 0;
}

export function refineSupplierReviewCommentary(
  data: { selectedChips: string[]; freeComment: string },
  ctx: RefinementCtx,
  pathPrefix: (string | number)[] = [],
): void {
  if (hasSupplierReviewCommentary(data.selectedChips, data.freeComment)) return;

  const message = 'Selecciona al menos una opción o escribe un comentario';
  ctx.addIssue({
    code: 'custom',
    message,
    path: [...pathPrefix, 'freeComment'],
  });
  ctx.addIssue({
    code: 'custom',
    message,
    path: [...pathPrefix, 'selectedChips'],
  });
}
