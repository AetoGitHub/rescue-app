import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_ADMINISTRATIVE_DETAIL_PATH } from '~/constants/rescue-administrative-flow';
import type { AdministrativeRescueDetail } from '~/interfaces/rescue/administrative';
import {
  mapAdministrativeDetailFromApi,
  unwrapAdministrativeDetailRecord,
} from '~/utils/rescue-administrative-api-map';

export function useRescueAdministrativeDetail(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const id = computed(() => toValue(rescueId));

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['rescue-administrative-detail', id.value ?? ''],
    enabled: () => id.value != null,
    query: async ({ signal }) => {
      const raw = await apiFetch<unknown>(
        RESCUE_ADMINISTRATIVE_DETAIL_PATH(id.value!),
        { signal },
      );
      return mapAdministrativeDetailFromApi(unwrapAdministrativeDetailRecord(raw));
    },
    refetchOnWindowFocus: false,
  });

  const detail = computed((): AdministrativeRescueDetail | null =>
    data.value ?? null,
  );

  const isInitialLoading = computed(
    () =>
      id.value != null
      && detail.value == null
      && error.value == null
      && (asyncStatus.value === 'idle' || asyncStatus.value === 'loading'),
  );

  const isPending = computed(() => asyncStatus.value === 'loading');

  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    detail,
    asyncStatus,
    isInitialLoading,
    isPending,
    error,
    errorMessage,
    refresh,
  };
}
