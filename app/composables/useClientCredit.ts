import { useQuery, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { clientCreditPath } from '~/constants/client-credit-api';
import type {
  ClientCreditSummary,
  CreditDetail,
  CreditFormState,
} from '~/interfaces/catalogs/credit';
import {
  hydrateClientCreditDisplayWithoutLine,
  mapClientCreditForm,
  mapClientCreditSummary,
  mapCreditDetail,
} from '~/utils/catalog-detail-map';
import { isClientCreditNotFoundError } from '~/utils/client-credit-not-found';

export type ClientCreditViewModel = {
  notFound: boolean;
  detail: CreditDetail | null;
  form: CreditFormState;
  summary: ClientCreditSummary;
  creditId: number | null;
};

function defaultCreditForm(): CreditFormState {
  return {
    limit: '0.00',
    days: 0,
    extension: 0,
    remision_tolerance: 0,
    requires_purchase_order: false,
    is_blocked: false,
  };
}

function toCreditFormState(form: Partial<CreditFormState>): CreditFormState {
  const defaults = defaultCreditForm();
  return {
    limit: form.limit ?? defaults.limit,
    days: form.days ?? defaults.days,
    extension: form.extension ?? defaults.extension,
    remision_tolerance: form.remision_tolerance ?? defaults.remision_tolerance,
    requires_purchase_order: form.requires_purchase_order ?? defaults.requires_purchase_order,
    is_blocked: form.is_blocked ?? defaults.is_blocked,
  };
}

function buildFallbackCreditView(
  clientType: string,
  clientDetailRaw: Record<string, unknown> | null,
): ClientCreditViewModel {
  const raw = clientDetailRaw ?? {};
  const summary = mapClientCreditSummary(raw);
  const form = mapClientCreditForm(raw);
  const hydrated = hydrateClientCreditDisplayWithoutLine(clientType, summary, form);

  return {
    notFound: true,
    detail: null,
    form: hydrated.form,
    summary: hydrated.summary,
    creditId: null,
  };
}

function mapRawToCreditView(raw: Record<string, unknown>): ClientCreditViewModel {
  const mapped = mapCreditDetail(raw);
  const creditId = mapped.creditId > 0 ? mapped.creditId : null;

  return {
    notFound: false,
    detail: raw as unknown as CreditDetail,
    form: toCreditFormState(mapped.form),
    summary: mapped.summary,
    creditId,
  };
}

/**
 * Client credit profile by client id (`GET /api/credit/client/{clientId}/`).
 * Reusable in catalog credit tab, quotes, and loan operative flow.
 */
export function useClientCredit(options: {
  clientId: MaybeRefOrGetter<number | null>;
  clientDetailFallback?: MaybeRefOrGetter<Record<string, unknown> | null>;
  clientType?: MaybeRefOrGetter<string | null>;
  enabled?: MaybeRefOrGetter<boolean>;
}) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();

  const clientId = computed(() => toValue(options.clientId));
  const enabledRef = computed(() => {
    if (clientId.value == null) return false;
    const extra = options.enabled;
    if (extra == null) return true;
    return toValue(extra);
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['client-credit', clientId.value ?? ''],
    enabled: () => enabledRef.value,
    query: async ({ signal }) => {
      const id = clientId.value as number;
      try {
        const raw = await apiFetch<Record<string, unknown>>(clientCreditPath(id), {
          signal,
        });
        return mapRawToCreditView(raw);
      } catch (fetchError) {
        if (isClientCreditNotFoundError(fetchError)) {
          const clientType = String(toValue(options.clientType) ?? 'CASH');
          const fallback = toValue(options.clientDetailFallback) ?? null;
          return buildFallbackCreditView(clientType, fallback);
        }
        throw fetchError;
      }
    },
    refetchOnWindowFocus: false,
  });

  const view = computed(() => data.value ?? null);
  const notFound = computed(() => view.value?.notFound ?? false);
  const detail = computed(() => view.value?.detail ?? null);
  const form = computed(() => view.value?.form ?? defaultCreditForm());
  const summary = computed(() => view.value?.summary ?? {
    credit_limit: null,
    credit_used: null,
    credit_available: null,
    overdue_invoices_count: 0,
    due_soon_invoices_count: 0,
  });
  const creditId = computed(() => view.value?.creditId ?? null);
  const hasCreditLine = computed(() => creditId.value != null);
  const creditLimit = computed(() => summary.value.credit_limit);
  const creditUsed = computed(() => summary.value.credit_used);
  const creditAvailable = computed(() => summary.value.credit_available);
  const isBlocked = computed(() => form.value.is_blocked);
  const isPending = computed(() => asyncStatus.value === 'loading');
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  function invalidate() {
    if (clientId.value == null) return;
    return queryCache.invalidateQueries({ key: ['client-credit', clientId.value] });
  }

  return {
    view,
    detail,
    form,
    summary,
    creditId,
    hasCreditLine,
    notFound,
    creditLimit,
    creditUsed,
    creditAvailable,
    isBlocked,
    isPending,
    asyncStatus,
    error,
    errorMessage,
    refresh,
    invalidate,
  };
}
