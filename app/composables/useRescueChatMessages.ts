import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import type { RescueChatMessage } from '~/interfaces/rescue';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

function rescueChatMessagesPath(rescueId: number) {
  return `/api/chat/${rescueId}/messages/`;
}

export function useRescueChatMessages(rescueId: MaybeRefOrGetter<number | null>) {
  const apiFetch = useApiFetch();
  const id = computed(() => toValue(rescueId));

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<RescueChatMessage>, Error, string | null>({
    key: () => ['rescue-chat-messages', id.value ?? ''],
    enabled: () => id.value != null,
    initialPageParam: null,
    query: ({ pageParam }) =>
      apiFetch<PaginatedResponse<RescueChatMessage>>(
        rescueChatMessagesPath(id.value!),
        {
          query: buildPaginatedQuery(undefined, pageParam),
        },
      ),
    getNextPageParam: getNextCursorPageParam,
  });

  const messages = computed(() =>
    flattenPaginatedPages<RescueChatMessage>(data.value?.pages),
  );
  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && messages.value.length === 0,
  );
  const isLoadingMore = computed(
    () => asyncStatus.value === 'loading' && messages.value.length > 0,
  );
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    messages,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    isInitialLoading,
    isLoadingMore,
    error,
    errorMessage,
    refresh,
  };
}
