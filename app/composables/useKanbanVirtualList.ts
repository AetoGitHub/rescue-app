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
  const virtualizer = useVirtualizer(
    computed(() => ({
      count: items.value.length,
      getScrollElement: () => scrollContainerRef.value,
      estimateSize: () => KANBAN_CARD_ESTIMATED_SIZE_PX,
      overscan: KANBAN_CARD_OVERSCAN,
      gap: KANBAN_CARD_GAP_PX,
      getItemKey: (index: number) => items.value[index]?.id ?? index,
    })),
  );

  /**
   * Real card heights are taller than the rough estimate above, so as each
   * visible card gets measured for the first time the virtualizer's own
   * "keep the visual position stable" compensation nudges `scrollTop` down
   * by the estimate→actual delta of every card above it — dozens of small
   * corrections that add up to the column opening pre-scrolled. We always
   * want it anchored at the top on load, so disable that compensation.
   *
   * Passing `shouldAdjustScrollPositionOnItemSizeChange` through the
   * options object (the documented way) is a no-op in
   * @tanstack/virtual-core@3.17.8: `setOptions` only stores the merged
   * options on `this.options` and never copies this one onto the instance,
   * while `resizeItem` reads it straight off `this` (not `this.options`).
   * Setting the instance property directly works around that bug.
   */
  virtualizer.value.shouldAdjustScrollPositionOnItemSizeChange = () => false;

  onMounted(() => {
    scrollContainerRef.value?.scrollTo({ top: 0 });
  });

  return virtualizer;
}
