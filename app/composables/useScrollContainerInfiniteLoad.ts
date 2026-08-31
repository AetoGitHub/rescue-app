import { useInfiniteScroll } from '@vueuse/core';
import type { AsyncStatus } from '@pinia/colada';

interface ScrollContainerInfiniteLoadOptions {
  containerRef: Readonly<Ref<HTMLElement | null>>;
  hasNextPage: Ref<boolean>;
  loadNextPage: () => unknown;
  asyncStatus: Ref<AsyncStatus>;
  disabled?: Ref<boolean>;
  distance?: number;
}

export function useScrollContainerInfiniteLoad(
  options: ScrollContainerInfiniteLoadOptions,
) {
  const isFetchingNextPage = ref(false);

  function canLoad() {
    if (options.disabled?.value) return false;
    return canLoadNextCursorPage({
      hasNextPage: options.hasNextPage.value,
      isFetchingNextPage: isFetchingNextPage.value,
      isPending: options.asyncStatus.value === 'loading',
    });
  }

  function loadMore() {
    if (!canLoad()) return;
    isFetchingNextPage.value = true;
    void Promise.resolve(options.loadNextPage()).finally(() => {
      isFetchingNextPage.value = false;
    });
  }

  useInfiniteScroll(
    () => options.containerRef.value,
    () => {
      loadMore();
    },
    {
      distance: options.distance ?? 200,
      canLoadMore: canLoad,
    },
  );
}
