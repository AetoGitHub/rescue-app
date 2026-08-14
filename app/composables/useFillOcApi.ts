import { useMutation, useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  FILL_OC_API_KEY_HEADER,
  FILL_OC_API_PATH,
  FILL_OC_LABELS,
  FILL_OC_QUERY_KEY,
} from '~/constants/fill-oc-api';
import type {
  FillOcPendingItem,
  FillOcSubmitBody,
} from '~/interfaces/nexxt-step/fill-oc';

function apiKeyHeaders(apiKey: string): Record<string, string> {
  return { [FILL_OC_API_KEY_HEADER]: apiKey };
}

export function useFillOcList(apiKey: MaybeRefOrGetter<string>) {
  const apiFetch = useApiFetch();
  const key = computed(() => toValue(apiKey).trim());

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [...FILL_OC_QUERY_KEY, key.value],
    enabled: () => key.value !== '',
    query: ({ signal }) =>
      apiFetch<FillOcPendingItem[]>(FILL_OC_API_PATH, {
        headers: apiKeyHeaders(key.value),
        signal,
      }),
  });

  const items = computed(() => data.value ?? []);
  const isInitialLoading = computed(
    () =>
      asyncStatus.value === 'loading'
      && data.value == null
      && error.value == null,
  );
  const isError = computed(() => error.value != null);
  const isUnauthorized = computed(() => {
    const status = getFetchStatusCode(error.value);
    return status === 401 || status === 403;
  });
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    items,
    asyncStatus,
    isInitialLoading,
    isError,
    isUnauthorized,
    errorMessage,
    refresh,
  };
}

export function useFillOcMutation(apiKey: MaybeRefOrGetter<string>) {
  const apiFetch = useApiFetch();
  const toast = useToast();

  /**
   * Sin invalidar la lista: la tarjeta muestra su animación de guardado y se
   * retira localmente; un refetch inmediato la haría desaparecer antes.
   */
  const { mutateAsync } = useMutation({
    mutation: (body: FillOcSubmitBody) =>
      apiFetch(FILL_OC_API_PATH, {
        method: 'POST',
        body,
        headers: apiKeyHeaders(toValue(apiKey).trim()),
      }),
    onError: (error) => {
      toast.add({
        title: FILL_OC_LABELS.errorToast,
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  return {
    submitOc: mutateAsync,
  };
}
