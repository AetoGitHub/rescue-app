export type RescueBoardViewMode = 'kanban' | 'list';

/** Explicit user choice from the URL; null when no valid `view` param. */
export function parseRescueBoardViewMode(
  raw: unknown,
): RescueBoardViewMode | null {
  if (raw === 'list' || raw === 'kanban') return raw;
  return null;
}

/**
 * Always explicit: the default depends on screen size (list on phones),
 * so stripping the param would lose the user's choice.
 */
export function rescueBoardViewQueryValue(
  mode: RescueBoardViewMode,
): string {
  return mode;
}
