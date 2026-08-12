import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { CLIENT_HAS_RESPONSIBLE_PATH } from '~/constants/client-api';
import type { ClientHasResponsibleResponse } from '~/interfaces/catalogs/client';
import { extractFetchErrorData } from '~/utils/fetch-error-message';

function getFetchStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const e = error as Record<string, unknown>;
  const code = e.statusCode ?? e.status;
  if (typeof code === 'number' && Number.isFinite(code)) return code;
  return undefined;
}

/** API returns 400 { detail: "No encontrado." } for missing/inactive clients. */
export function isClientHasResponsibleNotFoundError(error: unknown): boolean {
  if (getFetchStatusCode(error) === 400) return true;
  const data = extractFetchErrorData(error);
  const detail = data?.detail;
  return typeof detail === 'string' && /no encontrado/i.test(detail);
}

export function useClientHasResponsible(options: {
  clientId: MaybeRefOrGetter<number | null>;
  enabled?: MaybeRefOrGetter<boolean>;
}) {
  const apiFetch = useApiFetch();
  const clientId = computed(() => toValue(options.clientId));
  const enabledRef = computed(() => {
    if (clientId.value == null) return false;
    const extra = options.enabled;
    if (extra == null) return true;
    return toValue(extra);
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['client-has-responsible', clientId.value ?? ''],
    enabled: () => enabledRef.value,
    query: async ({ signal }) => {
      const id = clientId.value;
      if (id == null) {
        return { has_responsible: false } satisfies ClientHasResponsibleResponse;
      }

      try {
        return await apiFetch<ClientHasResponsibleResponse>(
          CLIENT_HAS_RESPONSIBLE_PATH(id),
          { signal },
        );
      } catch (fetchError) {
        if (isClientHasResponsibleNotFoundError(fetchError)) {
          return { has_responsible: false } satisfies ClientHasResponsibleResponse;
        }
        throw fetchError;
      }
    },
    refetchOnWindowFocus: false,
  });

  const hasResponsible = computed(() => data.value?.has_responsible === true);
  const isPending = computed(() => asyncStatus.value === 'loading');
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    hasResponsible,
    isPending,
    errorMessage,
    refresh,
  };
}
