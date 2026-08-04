import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import {
  FILL_OC_API_PATH,
  FILL_OC_LABELS,
  FILL_OC_QUERY_KEY,
} from '~/constants/fill-oc-api';
import type {
  FillOcPendingItem,
  FillOcSubmitBody,
} from '~/interfaces/nexxt-step/fill-oc';

export function useFillOcList() {
  const apiFetch = useApiFetch();

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [...FILL_OC_QUERY_KEY],
    query: () => apiFetch<FillOcPendingItem[]>(FILL_OC_API_PATH),
  });

  const items = computed(() => data.value ?? []);
  const isInitialLoading = computed(
    () =>
      asyncStatus.value === 'loading' &&
      data.value == null &&
      error.value == null,
  );
  const isError = computed(() => error.value != null);
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    items,
    asyncStatus,
    isInitialLoading,
    isError,
    errorMessage,
    refresh,
  };
}

export function useFillOcMutation() {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (body: FillOcSubmitBody) =>
      apiFetch(FILL_OC_API_PATH, {
        method: 'POST',
        body,
      }),
    onSuccess: async () => {
      await queryCache.invalidateQueries({ key: [...FILL_OC_QUERY_KEY] });
      toast.add({
        title: FILL_OC_LABELS.successToast,
        color: 'success',
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

  return {
    submitOc: mutateAsync,
    isSubmitting: computed(() => asyncStatus.value === 'loading'),
  };
}
