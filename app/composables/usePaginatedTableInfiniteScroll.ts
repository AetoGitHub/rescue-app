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
  /**
   * When true, load the next page if the table does not overflow
   * (client-side filters can leave too few visible rows to scroll).
   */
  autoFill?: Ref<boolean>;
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
    const result = useInfiniteScroll(
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

    if (typeof result === 'function') {
      return result;
    }

    return () => {
      if (typeof result === 'object' && result !== null && 'reset' in result) {
        (result as { reset: () => void }).reset();
      }
    };
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

  const distance = options.distance ?? 200;

  function tryAutoFill() {
    if (!options.autoFill?.value) return;
    if (
      !options.hasNextPage.value
      || options.asyncStatus.value === 'loading'
    ) {
      return;
    }

    const el = resolveScrollRoot();
    if (!el || el.clientHeight <= 0) return;

    if (el.scrollHeight <= el.clientHeight + distance) {
      void options.loadNextPage();
    }
  }

  watch(
    () => [
      options.autoFill?.value ?? false,
      options.hasNextPage.value,
      options.asyncStatus.value,
      resolveScrollRoot()?.clientHeight ?? 0,
      resolveScrollRoot()?.scrollHeight ?? 0,
    ],
    () => {
      tryAutoFill();
    },
    { immediate: true, flush: 'post' },
  );

  onScopeDispose(() => {
    stopScroll?.();
  });
}
