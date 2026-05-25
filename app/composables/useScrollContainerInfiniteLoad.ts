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
  useInfiniteScroll(
    () => options.containerRef.value,
    () => {
      if (options.disabled?.value) return;

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
        !options.disabled?.value
        && options.hasNextPage.value
        && options.asyncStatus.value !== 'loading',
    },
  );
}
