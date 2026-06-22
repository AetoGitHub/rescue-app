import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  OPERATIVE_BALANCE_PATH,
  SELLER_BALANCE_PATH,
  resolveBalanceProfile,
} from '~/constants/payment-api';
import type {
  OperativeBalanceResponse,
} from '~/interfaces/payment/balance-operative';
import type {
  SellerBalanceResponse,
} from '~/interfaces/payment/balance-seller';
import type { BalanceVoucher } from '~/interfaces/payment/balance';
import { parsePositiveIntQuery } from '~~/shared/utils/payment-balance-query';

export function useMyBalance(
  userId: MaybeRefOrGetter<number | null | undefined> = undefined,
  testDays: MaybeRefOrGetter<number | null | undefined> = undefined,
) {
  const apiFetch = useApiFetch();
  const { user } = useUserSession();

  const resolvedUserId = computed(() => {
    const explicit = userId != null ? toValue(userId) : undefined;
    return explicit ?? user.value?.id ?? null;
  });

  const balanceProfile = computed(() =>
    resolveBalanceProfile(user.value?.role),
  );

  const resolvedTestDays = computed(() => {
    if (!import.meta.dev) return null;
    const value = testDays != null ? toValue(testDays) : null;
    if (value == null) return null;
    return parsePositiveIntQuery(value);
  });

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      'my-balance',
      balanceProfile.value ?? 'none',
      resolvedUserId.value ?? '',
      resolvedTestDays.value ?? '',
    ],
    enabled: () =>
      resolvedUserId.value != null && balanceProfile.value != null,
    query: async ({ signal }) => {
      const id = resolvedUserId.value!;
      const profile = balanceProfile.value!;

      if (profile === 'seller') {
        return apiFetch<SellerBalanceResponse>(SELLER_BALANCE_PATH, {
          query: { seller: id },
          signal,
        });
      }

      const operativeQuery: Record<string, string | number> = { operator: id };
      if (resolvedTestDays.value != null) {
        operativeQuery.test_days = resolvedTestDays.value;
      }

      return apiFetch<OperativeBalanceResponse>(OPERATIVE_BALANCE_PATH, {
        query: operativeQuery,
        signal,
      });
    },
    refetchOnWindowFocus: false,
  });

  const vouchers = computed((): BalanceVoucher[] => data.value?.results ?? []);
  const total = computed(() => data.value?.total ?? '0');
  const isPending = computed(() => asyncStatus.value === 'loading');
  const hasBalanceProfile = computed(() => balanceProfile.value != null);
  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  return {
    vouchers,
    total,
    isPending,
    hasBalanceProfile,
    balanceProfile,
    errorMessage,
    testDays: resolvedTestDays,
    refresh,
  };
}
