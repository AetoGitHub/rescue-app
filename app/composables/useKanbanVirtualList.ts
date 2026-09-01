import { useVirtualizer } from '@tanstack/vue-virtual';
import type { Ref } from 'vue';

const KANBAN_CARD_ESTIMATED_SIZE_PX = 160;
const KANBAN_CARD_GAP_PX = 8;
const KANBAN_CARD_OVERSCAN = 6;

/**
 * Renders only the kanban cards near the viewport instead of the full
 * accumulated infinite-scroll cache, which otherwise blocks the main thread
 * for seconds once a column has loaded hundreds of cards.
 */
export function useKanbanVirtualList<T extends { id?: number }>(
  items: Ref<T[]>,
  scrollContainerRef: Readonly<Ref<HTMLElement | null>>,
) {
  return useVirtualizer(
    computed(() => ({
      count: items.value.length,
      getScrollElement: () => scrollContainerRef.value,
      estimateSize: () => KANBAN_CARD_ESTIMATED_SIZE_PX,
      overscan: KANBAN_CARD_OVERSCAN,
      gap: KANBAN_CARD_GAP_PX,
      getItemKey: (index: number) => items.value[index]?.id ?? index,
    })),
  );
}
