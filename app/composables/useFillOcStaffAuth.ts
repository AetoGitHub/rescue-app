import { useInfiniteQuery, useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  FILL_OC_AUTH_TOKEN_API_PATH,
  FILL_OC_LABELS,
} from '~/constants/fill-oc-api';
import type { FillOcStaffToken } from '~/interfaces/nexxt-step/fill-oc';
import type {
  RescueChatMessage,
  RescueChatMessageCreateBody,
  RescueChatMessageCreateResponse,
} from '~/interfaces/rescue';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';
import {
  appendFillOcMockChatMessage,
  delayFillOcMock,
  getFillOcMockChatPage,
  getFillOcMockStaffToken,
  isFillOcMockKey,
} from '~/mocks/fill-oc';
import {
  fillOcStaffChatCreatePath,
  fillOcStaffChatMessagesPath,
  fillOcStaffChatQueryKey,
  toFillOcStaffProxyPath,
} from '~/utils/fill-oc-staff-paths';
import { mapFillOcStaffToken } from '~/utils/fill-oc-staff-token';

export type FillOcStaffFetchOptions = {
  method?: 'GET' | 'POST';
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
};

export type FillOcStaffFetch = (
  path: string,
  options?: FillOcStaffFetchOptions,
) => Promise<unknown>;

export function useFillOcStaffToken(apiKey: MaybeRefOrGetter<string>) {
  const tokenState = ref<FillOcStaffToken | null>(null);
  const pending = ref<Promise<FillOcStaffToken> | null>(null);

  const key = computed(() => toValue(apiKey).trim());

  async function exchangeToken(): Promise<FillOcStaffToken> {
    if (isFillOcMockKey(key.value)) {
      await delayFillOcMock(120);
      return getFillOcMockStaffToken();
    }

    const raw = await $fetch<unknown>(FILL_OC_AUTH_TOKEN_API_PATH, {
      query: { key: key.value },
    });
    const mapped = mapFillOcStaffToken(raw);
    if (!mapped) {
      throw new Error('No se pudo obtener el token de chat');
    }
    return mapped;
  }

  async function ensureToken(options?: { force?: boolean }): Promise<FillOcStaffToken> {
    if (!options?.force && tokenState.value?.token) {
      return tokenState.value;
    }
    if (options?.force) {
      pending.value = null;
    }
    if (pending.value) return pending.value;

    const request = exchangeToken()
      .then((next) => {
        tokenState.value = next;
        return next;
      })
      .finally(() => {
        pending.value = null;
      });

    pending.value = request;
    return request;
  }

  async function staffFetch<T>(path: string, options?: FillOcStaffFetchOptions): Promise<T> {
    const run = async (force: boolean) => {
      const auth = await ensureToken({ force });
      return $fetch<T>(path, {
        method: options?.method,
        query: options?.query,
        body: options?.body,
        signal: options?.signal,
        headers: {
          Authorization: `Token ${auth.token}`,
        },
      });
    };

    try {
      return await run(false);
    } catch (error) {
      const status = getFetchStatusCode(error);
      if (status === 401 || status === 403) {
        return await run(true);
      }
      throw error;
    }
  }

  async function evidenceApiFetch(
    url: string,
    options?: Record<string, unknown>,
  ): Promise<unknown> {
    if (isFillOcMockKey(key.value)) {
      await delayFillOcMock(200);
      throw new Error(FILL_OC_LABELS.evidenceEmpty);
    }

    return staffFetch(toFillOcStaffProxyPath(url), {
      method: (options?.method as 'GET' | 'POST' | undefined) ?? 'GET',
      query: options?.query as Record<string, unknown> | undefined,
      body: options?.body,
    });
  }

  return {
    token: computed(() => tokenState.value?.token ?? ''),
    userId: computed(() => tokenState.value?.userId ?? null),
    ensureToken,
    staffFetch,
    evidenceApiFetch,
  };
}

export function useFillOcStaffChatMessages(
  rescueId: MaybeRefOrGetter<number | null>,
  staffFetch: FillOcStaffFetch,
  options?: { enabled?: MaybeRefOrGetter<boolean>; mock?: MaybeRefOrGetter<boolean> },
) {
  const id = computed(() => toValue(rescueId));
  const enabledRef = computed(() => {
    if (id.value == null) return false;
    if (options?.enabled == null) return true;
    return toValue(options.enabled);
  });

  const {
    data,
    asyncStatus,
    hasNextPage,
    loadNextPage,
    error,
    refresh,
  } = useInfiniteQuery<PaginatedResponse<RescueChatMessage>, Error, string | null>({
    key: () => fillOcStaffChatQueryKey(id.value ?? 0),
    enabled: () => enabledRef.value,
    initialPageParam: null,
    query: async ({ pageParam }) => {
      if (toValue(options?.mock)) {
        await delayFillOcMock(160);
        return getFillOcMockChatPage(id.value!);
      }

      return staffFetch(
        fillOcStaffChatMessagesPath(id.value!),
        {
          query: buildPaginatedQuery(undefined, pageParam),
        },
      ) as Promise<PaginatedResponse<RescueChatMessage>>;
    },
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
    errorMessage,
    refresh,
  };
}

export function useFillOcStaffChatSendMessage(
  rescueId: MaybeRefOrGetter<number | null>,
  staffFetch: FillOcStaffFetch,
  options?: { enabled?: MaybeRefOrGetter<boolean>; mock?: MaybeRefOrGetter<boolean> },
) {
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));
  const enabledRef = computed(() => {
    if (id.value == null) return false;
    if (options?.enabled == null) return true;
    return toValue(options.enabled);
  });

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: async (text: string) => {
      const currentId = id.value;
      if (currentId == null) {
        return Promise.reject(new Error('Sin solicitud seleccionada'));
      }

      if (toValue(options?.mock)) {
        await delayFillOcMock(200);
        appendFillOcMockChatMessage(currentId, text);
        return { id: Date.now() } satisfies RescueChatMessageCreateResponse;
      }

      const body: RescueChatMessageCreateBody = {
        text: text.trim(),
        response_to: null,
      };

      return staffFetch(fillOcStaffChatCreatePath(currentId), {
        method: 'POST',
        body,
      }) as Promise<RescueChatMessageCreateResponse>;
    },
    onSuccess: async () => {
      const currentId = id.value;
      if (currentId != null) {
        await queryCache.invalidateQueries({
          key: fillOcStaffChatQueryKey(currentId),
        });
      }
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo enviar el mensaje',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const sendLocked = ref(false);
  const isSending = computed(
    () =>
      enabledRef.value
      && (sendLocked.value || asyncStatus.value === 'loading'),
  );

  async function sendMessageAsync(text: string) {
    if (!enabledRef.value || isSending.value) return;
    sendLocked.value = true;
    try {
      await mutateAsync(text);
    } finally {
      sendLocked.value = false;
    }
  }

  return {
    sendMessageAsync,
    isSending,
  };
}
