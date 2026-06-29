export type RescueBoardViewMode = 'kanban' | 'list';

export function parseRescueBoardViewMode(
  raw: unknown,
): RescueBoardViewMode {
  return raw === 'list' ? 'list' : 'kanban';
}

export function rescueBoardViewQueryValue(
  mode: RescueBoardViewMode,
): string | undefined {
  return mode === 'list' ? 'list' : undefined;
}
