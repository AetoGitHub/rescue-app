import { useQuery } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  OPERATIVE_BALANCE_PATH,
  SELLER_BALANCE_PATH,
  resolveBalanceProfile,
} from '~/constants/payment-api';
import type {
  OperativeBalanceResponse,
  OperativeBalanceVoucher,
} from '~/interfaces/payment/balance-operative';

export function useMyBalance(
  userId: MaybeRefOrGetter<number | null | undefined> = undefined,
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

  const { data, asyncStatus, error, refresh } = useQuery({
    key: () => [
      'my-balance',
      balanceProfile.value ?? 'none',
      resolvedUserId.value ?? '',
    ],
    enabled: () =>
      resolvedUserId.value != null && balanceProfile.value != null,
    query: async ({ signal }) => {
      const id = resolvedUserId.value!;
      const profile = balanceProfile.value!;

      if (profile === 'seller') {
        return apiFetch<OperativeBalanceResponse>(SELLER_BALANCE_PATH, {
          query: { seller: id },
          signal,
        });
      }

      return apiFetch<OperativeBalanceResponse>(OPERATIVE_BALANCE_PATH, {
        query: { operator: id },
        signal,
      });
    },
    refetchOnWindowFocus: false,
  });

  const vouchers = computed((): OperativeBalanceVoucher[] => data.value?.results ?? []);
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
    refresh,
  };
}
