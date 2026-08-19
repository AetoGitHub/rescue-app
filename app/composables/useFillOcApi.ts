import { useMutation, useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  FILL_OC_API_PATH,
  FILL_OC_LABELS,
  FILL_OC_QUERY_KEY,
} from '~/constants/fill-oc-api';
import type {
  FillOcListResult,
  FillOcPendingItem,
  FillOcSubmitBody,
} from '~/interfaces/nexxt-step/fill-oc';
import {
  delayFillOcMock,
  getFillOcMockListResult,
  isFillOcMockKey,
} from '~/mocks/fill-oc';

function emptyFillOcListResult(
  errorStatus: number | null,
  errorMessage: string,
): FillOcListResult {
  return { items: [], errorStatus, errorMessage };
}

export function useFillOcList(apiKey: MaybeRefOrGetter<string>) {
  const apiFetch = useApiFetch();
  const key = computed(() => toValue(apiKey).trim());

  /**
   * No re-lanzar el fetch: en SSR un 401 con statusCode dispara error.vue.
   * La UI lee `errorStatus` y muestra el estado controlado.
   */
  const { data, asyncStatus, refresh } = useQuery({
    key: () => [...FILL_OC_QUERY_KEY, key.value],
    enabled: () => key.value !== '',
    query: async ({ signal }): Promise<FillOcListResult> => {
      if (isFillOcMockKey(key.value)) {
        await delayFillOcMock();
        return getFillOcMockListResult(key.value);
      }

      try {
        const payload = await apiFetch<FillOcPendingItem[]>(FILL_OC_API_PATH, {
          query: { key: key.value },
          signal,
        });
        return {
          items: Array.isArray(payload) ? payload : [],
          errorStatus: null,
          errorMessage: '',
        };
      } catch (error) {
        return emptyFillOcListResult(
          getFetchStatusCode(error) ?? 500,
          getFetchErrorMessage(error),
        );
      }
    },
  });

  const items = computed(() => data.value?.items ?? []);
  const isInitialLoading = computed(
    () => asyncStatus.value === 'loading' && data.value == null,
  );
  const errorStatus = computed(() => data.value?.errorStatus ?? null);
  const isError = computed(() => errorStatus.value != null);
  const isUnauthorized = computed(() => {
    const status = errorStatus.value;
    return status === 401 || status === 403;
  });
  const errorMessage = computed(() => data.value?.errorMessage ?? '');

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
  const { mutateAsync, asyncStatus } = useMutation({
    mutation: async (body: FillOcSubmitBody) => {
      const currentKey = toValue(apiKey).trim();
      if (isFillOcMockKey(currentKey)) {
        await delayFillOcMock(400);
        return;
      }

      return apiFetch(FILL_OC_API_PATH, {
        method: 'POST',
        body,
        query: { key: currentKey },
      });
    },
    onError: (error) => {
      toast.add({
        title: FILL_OC_LABELS.errorToast,
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const submitting = ref(false);

  async function submitOc(body: FillOcSubmitBody) {
    if (submitting.value || asyncStatus.value === 'loading') return;
    submitting.value = true;
    try {
      return await mutateAsync(body);
    } finally {
      submitting.value = false;
    }
  }

  return {
    submitOc,
    isSubmitting: computed(
      () => submitting.value || asyncStatus.value === 'loading',
    ),
  };
}
