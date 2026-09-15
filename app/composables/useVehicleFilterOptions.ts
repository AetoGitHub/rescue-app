import { useQuery } from '@pinia/colada';
import { refDebounced } from '@vueuse/core';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_ADMINISTRATIVE_VEHICLE_FILTER_PATH } from '~/constants/rescue-administrative-flow';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

/** Vehicle code autocomplete, scoped to the current client/company filters. */
export function useVehicleFilterOptions(options?: {
  clientId?: MaybeRefOrGetter<number | null>;
  companyId?: MaybeRefOrGetter<number | null>;
}) {
  const apiFetch = useApiFetch();
  const searchTerm = ref('');
  const debouncedSearch = refDebounced(searchTerm, 300);

  const clientId = computed(() => toValue(options?.clientId) ?? null);
  const companyId = computed(() => toValue(options?.companyId) ?? null);

  const { data, asyncStatus, error } = useQuery<PaginatedResponse<string>>({
    key: () => [
      'vehicle-filter',
      debouncedSearch.value,
      clientId.value != null ? String(clientId.value) : '',
      companyId.value != null ? String(companyId.value) : '',
    ],
    query: ({ signal }) => {
      const query: Record<string, string> = {};
      const vehicle = debouncedSearch.value.trim();
      if (vehicle) query.vehicle = vehicle;
      if (clientId.value != null) query.client = String(clientId.value);
      if (companyId.value != null) {
        query.client__company = String(companyId.value);
      }
      return apiFetch<PaginatedResponse<string>>(
        RESCUE_ADMINISTRATIVE_VEHICLE_FILTER_PATH,
        { query, signal },
      );
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const items = computed(() => data.value?.results ?? []);
  const loading = computed(() => asyncStatus.value === 'loading');
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return { searchTerm, items, loading, errorMessage };
}
