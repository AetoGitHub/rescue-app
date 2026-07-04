import { useInfiniteQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_GUEST_CHAT_MESSAGES_PATH } from '~/constants/rescue-approve-link-api';
import type { RescueChatMessage } from '~/interfaces/rescue';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import { guestRescueChatQueryKey } from '~/utils/guest-rescue-chat';

export function useGuestRescueChatMessages(
  rescueId: MaybeRefOrGetter<number | null>,
  token: MaybeRefOrGetter<string | null>,
  options?: { enabled?: MaybeRefOrGetter<boolean> },
) {
  const id = computed(() => toValue(rescueId));
  const tokenValue = computed(() => toValue(token)?.trim() ?? '');

  const enabledRef = computed(() => {
    if (id.value == null || !tokenValue.value) return false;
    const extra = options?.enabled;
    if (extra == null) return true;
    return toValue(extra);
  });

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<RescueChatMessage>, Error, string | null>({
    key: () => guestRescueChatQueryKey(id.value ?? 0, tokenValue.value),
    enabled: () => enabledRef.value,
    initialPageParam: null,
    query: ({ pageParam }) =>
      guestApiFetch<PaginatedResponse<RescueChatMessage>>(
        RESCUE_GUEST_CHAT_MESSAGES_PATH(id.value!, tokenValue.value),
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
