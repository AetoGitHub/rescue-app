import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import { PAYMENT_CART_PATH } from '~/constants/payment-api';
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

export interface PaymentCartAddSelectedPayload {
  type: PaymentRecipientType;
  ids: number[];
  quiet?: boolean;
  userId?: number | null;
  userName?: string | null;
}

export function usePaymentCart() {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();

  const {
    data: cart,
    asyncStatus,
    error,
    refresh,
  } = useQuery({
    key: () => ['payment-cart'],
    query: ({ signal }) =>
      apiFetch<PaymentCartResponse>(PAYMENT_CART_PATH, { signal }),
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
    mutation: () =>
      apiFetch<void>(PAYMENT_CART_PATH, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await invalidateCartAndList();
      usePaymentCheckoutRecipient().clearRecipient();
      toast.add({
        title: 'Carrito vaciado',
        color: 'success',
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo vaciar el carrito',
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

  return {
    cart,
    asyncStatus,
    errorMessage,
    isLoading,
    isAdding,
    isClearing,
    refresh,
    cartItemIds,
    addSelected,
    addAll,
    clearCart,
  };
}
