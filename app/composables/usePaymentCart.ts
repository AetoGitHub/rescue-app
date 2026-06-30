import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  PAYMENT_CART_PATH,
  PAYMENT_CART_PAY_PATH,
} from '~/constants/payment-api';
import type { PaymentCartPayBody } from '~/interfaces/payment/cart-pay';
import type { PaymentReceiptSummary } from '~/interfaces/payment/receipt';
import type {
  PaymentCartAddOperativeBody,
  PaymentCartAddSellerBody,
  PaymentCartResponse,
} from '~/interfaces/payment/cart';
import type { PaymentRecipientType } from '~/constants/payment-api';
import {
  buildPaymentCartAddAllQuery,
  paymentListQueryKey,
  type PaymentListFilterInput,
} from '~/utils/payment-list-query';
import { buildPaymentCartQuery } from '~/utils/payment-cart-query';

export interface PaymentCartAddSelectedPayload {
  type: PaymentRecipientType;
  ids: number[];
  quiet?: boolean;
  userId?: number | null;
  userName?: string | null;
}

export interface PaymentCartClearOptions {
  quiet?: boolean;
}

export function usePaymentCart(
  testDays: MaybeRefOrGetter<number | null | undefined> = undefined,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();

  const resolvedTestDays = computed(() => {
    if (!import.meta.dev) return null;
    const value = testDays != null ? toValue(testDays) : null;
    return value ?? null;
  });

  const cartQuery = computed(() =>
    buildPaymentCartQuery({ testDays: resolvedTestDays.value }),
  );

  const {
    data: cart,
    asyncStatus,
    error,
    refresh,
  } = useQuery({
    key: () => ['payment-cart', resolvedTestDays.value ?? ''],
    query: ({ signal }) =>
      apiFetch<PaymentCartResponse>(PAYMENT_CART_PATH, {
        query: cartQuery.value,
        signal,
      }),
    refetchOnWindowFocus: false,
  });

  const isLoading = computed(() => asyncStatus.value === 'loading');

  const errorMessage = computed(() =>
    error.value != null ? getFetchErrorMessage(error.value) : '',
  );

  function cartItemIds(type: PaymentRecipientType): Set<number> {
    const section =
      type === 'operative' ? cart.value?.operative : cart.value?.seller;
    return new Set((section?.items ?? []).map((item) => item.id));
  }

  async function invalidateCartAndList(filters?: PaymentListFilterInput) {
    await queryCache.invalidateQueries({ key: ['payment-cart'] });
    await queryCache.invalidateQueries({ key: ['payment-debt'] });
    if (filters?.userId != null) {
      await queryCache.invalidateQueries({
        key: paymentListQueryKey(filters),
      });
    }
  }

  const { mutateAsync: addSelected, asyncStatus: addSelectedStatus } =
    useMutation({
      mutation: (payload: PaymentCartAddSelectedPayload) => {
        const body: PaymentCartAddOperativeBody | PaymentCartAddSellerBody =
          payload.type === 'operative'
            ? { operative_ids: payload.ids }
            : { seller_ids: payload.ids };

        return apiFetch<PaymentCartResponse>(PAYMENT_CART_PATH, {
          method: 'POST',
          body,
        });
      },
      onSuccess: async (_data, payload) => {
        await invalidateCartAndList();

        if (payload.userId != null) {
          const { setRecipient } = usePaymentCheckoutRecipient();
          setRecipient({
            type: payload.type,
            userId: payload.userId,
            userName: payload.userName?.trim() || null,
          });
        }

        if (!payload.quiet) {
          toast.add({
            title: 'Agregado al carrito',
            color: 'success',
          });
        }
      },
      onError: (error) => {
        toast.add({
          title: 'No se pudo agregar al carrito',
          description: getFetchErrorMessage(error),
          color: 'error',
        });
      },
    });

  const { mutateAsync: addAll, asyncStatus: addAllStatus } = useMutation({
    mutation: (filters: PaymentListFilterInput) => {
      const query = buildPaymentCartAddAllQuery(filters);
      if (!query) {
        throw new Error('Selecciona un usuario antes de agregar todos.');
      }

      return apiFetch<PaymentCartResponse>(PAYMENT_CART_PATH, {
        method: 'POST',
        query,
      });
    },
    onSuccess: async (_data, filters) => {
      await invalidateCartAndList(filters);

      if (filters.userId != null) {
        const { setRecipient } = usePaymentCheckoutRecipient();
        setRecipient({
          type: filters.type,
          userId: filters.userId,
          userName: null,
        });
      }

      toast.add({
        title: 'Deudas agregadas al carrito',
        color: 'success',
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudieron agregar las deudas',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const { mutateAsync: clearCart, asyncStatus: clearStatus } = useMutation({
    mutation: (_options: PaymentCartClearOptions = {}) =>
      apiFetch(PAYMENT_CART_PATH, {
        method: 'DELETE',
      }),
    onSuccess: async (_data, options) => {
      await invalidateCartAndList();
      usePaymentCheckoutRecipient().clearRecipient();
      if (!options?.quiet) {
        toast.add({
          title: 'Carrito vaciado',
          color: 'success',
        });
      }
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo vaciar el carrito',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const { mutateAsync: payCart, asyncStatus: payStatus } = useMutation({
    mutation: (body: PaymentCartPayBody) => {
      const payload: PaymentCartPayBody = {};

      if (body.forgiven != null && body.forgiven.length > 0) {
        payload.forgiven = body.forgiven;
      }

      if (body.forgiven_debt != null && body.forgiven_debt.length > 0) {
        payload.forgiven_debt = body.forgiven_debt;
      }

      return apiFetch<PaymentReceiptSummary>(PAYMENT_CART_PAY_PATH, {
        method: 'POST',
        body: payload,
      });
    },
    onSuccess: async () => {
      await invalidateCartAndList();
      usePaymentCheckoutRecipient().clearRecipient();
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo completar el pago',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const isAdding = computed(
    () =>
      addSelectedStatus.value === 'loading'
      || addAllStatus.value === 'loading',
  );

  const isClearing = computed(() => clearStatus.value === 'loading');
  const isPaying = computed(() => payStatus.value === 'loading');

  return {
    cart,
    asyncStatus,
    errorMessage,
    isLoading,
    isAdding,
    isClearing,
    isPaying,
    refresh,
    cartItemIds,
    addSelected,
    addAll,
    clearCart,
    payCart,
  };
}
