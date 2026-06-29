import { useInfiniteScroll } from '@vueuse/core';
import type { Ref, ShallowRef } from 'vue';
import type { AsyncStatus } from '@pinia/colada';

interface PaginatedTableInfiniteScrollOptions {
  tableRef: Readonly<ShallowRef<{ $el?: HTMLElement | null } | null>>;
  hasNextPage: Ref<boolean>;
  loadNextPage: () => unknown;
  asyncStatus: Ref<AsyncStatus>;
  distance?: number;
  /** Scroll container; defaults to `tableRef.$el` (Nuxt UI infinite-scroll pattern). */
  scrollRootRef?: Readonly<Ref<HTMLElement | null>>;
}

export function usePaginatedTableInfiniteScroll(
  options: PaginatedTableInfiniteScrollOptions,
) {
  let stopScroll: (() => void) | undefined;

  function resolveScrollRoot(): HTMLElement | null {
    if (options.scrollRootRef?.value) {
      return options.scrollRootRef.value;
    }

    return options.tableRef.value?.$el ?? null;
  }

  function attachInfiniteScroll(el: HTMLElement) {
    const { stop } = useInfiniteScroll(
      el,
      () => {
        if (
          options.hasNextPage.value
          && options.asyncStatus.value !== 'loading'
        ) {
          void options.loadNextPage();
        }
      },
      {
        distance: options.distance ?? 200,
        canLoadMore: () =>
          options.hasNextPage.value
          && options.asyncStatus.value !== 'loading',
      },
    );

    return stop;
  }

  watch(
    () => resolveScrollRoot(),
    (el, _prev, onCleanup) => {
      stopScroll?.();
      stopScroll = undefined;

      if (!el) return;

      stopScroll = attachInfiniteScroll(el);
      onCleanup(() => {
        stopScroll?.();
        stopScroll = undefined;
      });
    },
    { immediate: true, flush: 'post' },
  );

  onScopeDispose(() => {
    stopScroll?.();
  });
}
