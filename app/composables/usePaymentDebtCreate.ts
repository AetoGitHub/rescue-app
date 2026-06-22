import { useMutation, useQueryCache } from '@pinia/colada';
import { PAYMENT_DEBT_CREATE_PATH } from '~/constants/payment-api';
import type { PaymentDebtCreateBody } from '~/interfaces/payment/debt';

export function usePaymentDebtCreate() {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();

  const { mutateAsync: createDebt, asyncStatus } = useMutation({
    mutation: (body: PaymentDebtCreateBody) =>
      apiFetch(PAYMENT_DEBT_CREATE_PATH, {
        method: 'POST',
        body,
      }),
    onSuccess: async () => {
      await queryCache.invalidateQueries({ key: ['payment-debt'] });
      await queryCache.invalidateQueries({ key: ['payment-cart'] });
      toast.add({
        title: 'Deuda creada',
        color: 'success',
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo crear la deuda',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const isCreating = computed(() => asyncStatus.value === 'loading');

  return {
    createDebt,
    isCreating,
  };
}
