export const KANBAN_MOUNTED_COLUMN_BUFFER = 1;

export function isKanbanColumnInMountWindow(
  index: number,
  activeIndex: number,
  options?: { windowed?: boolean; buffer?: number },
): boolean {
  if (!options?.windowed) return true;
  const buffer = options.buffer ?? KANBAN_MOUNTED_COLUMN_BUFFER;
  return Math.abs(index - activeIndex) <= buffer;
}

/** Pick the child whose left edge is closest to the scroll container's left. */
export function getKanbanActiveColumnIndex(
  containerLeft: number,
  childLefts: readonly number[],
): number {
  if (childLefts.length === 0) return 0;

  let best = 0;
  let bestDist = Infinity;

  for (let i = 0; i < childLefts.length; i++) {
    const dist = Math.abs((childLefts[i] ?? 0) - containerLeft);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }

  return best;
}
