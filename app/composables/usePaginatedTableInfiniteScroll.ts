import { useInfiniteScroll } from '@vueuse/core';
import type { ShallowRef } from 'vue';
import type { AsyncStatus } from '@pinia/colada';

interface PaginatedTableInfiniteScrollOptions {
  tableRef: Readonly<ShallowRef<{ $el?: HTMLElement | null } | null>>;
  hasNextPage: Ref<boolean>;
  loadNextPage: () => unknown;
  asyncStatus: Ref<AsyncStatus>;
  distance?: number;
}

export function usePaginatedTableInfiniteScroll(
  options: PaginatedTableInfiniteScrollOptions,
) {
  onMounted(() => {
    useInfiniteScroll(
      () => options.tableRef.value?.$el ?? null,
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
  });
}
