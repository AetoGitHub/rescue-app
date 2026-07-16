import { useQuery, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { companyCreditPath } from '~/constants/client-credit-api';
import type {
  ClientCreditSummary,
  CreditFormState,
} from '~/interfaces/catalogs/credit';
import { mapCreditDetail } from '~/utils/catalog-detail-map';
import { isClientCreditNotFoundError } from '~/utils/client-credit-not-found';

export type CompanyCreditViewModel = {
  notFound: boolean;
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

function emptySummary(): ClientCreditSummary {
  return {
    credit_limit: null,
    credit_used: null,
    credit_available: null,
    overdue_invoices_count: 0,
    due_soon_invoices_count: 0,
  };
}

function toCreditFormState(form: Partial<CreditFormState>): CreditFormState {
  const defaults = defaultCreditForm();
  return {
    limit: form.limit ?? defaults.limit,
    days: form.days ?? defaults.days,
    extension: form.extension ?? defaults.extension,
    remision_tolerance: form.remision_tolerance ?? defaults.remision_tolerance,
    requires_purchase_order:
      form.requires_purchase_order ?? defaults.requires_purchase_order,
    is_blocked: form.is_blocked ?? defaults.is_blocked,
  };
}

/**
 * Company credit profile by company id (`GET /api/credit/company/{companyId}/`).
 * Reused by the company slideover credit section and client-create prefill.
 */
export function useCompanyCredit(options: {
  companyId: MaybeRefOrGetter<number | null>;
  enabled?: MaybeRefOrGetter<boolean>;
}) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();

  const companyId = computed(() => toValue(options.companyId));
  const enabledRef = computed(() => {
    if (companyId.value == null) return false;
    const extra = options.enabled;
    if (extra == null) return true;
    return toValue(extra);
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => ['company-credit', companyId.value ?? ''],
    enabled: () => enabledRef.value,
    query: async ({ signal }): Promise<CompanyCreditViewModel> => {
      const id = companyId.value as number;
      try {
        const raw = await apiFetch<Record<string, unknown>>(
          companyCreditPath(id),
          { signal },
        );
        const mapped = mapCreditDetail(raw);
        return {
          notFound: false,
          form: toCreditFormState(mapped.form),
          summary: mapped.summary,
          creditId: mapped.creditId > 0 ? mapped.creditId : null,
        };
      } catch (fetchError) {
        if (isClientCreditNotFoundError(fetchError)) {
          return {
            notFound: true,
            form: defaultCreditForm(),
            summary: emptySummary(),
            creditId: null,
          };
        }
        throw fetchError;
      }
    },
    refetchOnWindowFocus: false,
  });

  const view = computed(() => data.value ?? null);
  const notFound = computed(() => view.value?.notFound ?? false);
  const form = computed(() => view.value?.form ?? defaultCreditForm());
  const summary = computed(() => view.value?.summary ?? emptySummary());
  const creditId = computed(() => view.value?.creditId ?? null);
  const hasCreditLine = computed(() => creditId.value != null);
  const isPending = computed(() => asyncStatus.value === 'loading');
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  function invalidate() {
    if (companyId.value == null) return;
    return queryCache.invalidateQueries({
      key: ['company-credit', companyId.value],
    });
  }

  return {
    view,
    form,
    summary,
    creditId,
    hasCreditLine,
    notFound,
    isPending,
    asyncStatus,
    error,
    errorMessage,
    refresh,
    invalidate,
  };
}
