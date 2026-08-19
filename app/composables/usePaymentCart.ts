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

  const { mutateAsync: addSelectedAsync, asyncStatus: addSelectedStatus } =
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

  const { mutateAsync: addAllAsync, asyncStatus: addAllStatus } = useMutation({
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

  const { mutateAsync: clearCartAsync, asyncStatus: clearStatus } = useMutation({
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

  const { mutateAsync: payCartAsync, asyncStatus: payStatus } = useMutation({
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

  const addingIds = ref<Set<number>>(new Set());
  const addingAllLock = ref(false);
  const clearingLock = ref(false);
  const payingLock = ref(false);

  async function addSelected(payload: PaymentCartAddSelectedPayload) {
    const ids = [...new Set(payload.ids)];
    if (
      addingAllLock.value
      || ids.length === 0
      || ids.some((id) => addingIds.value.has(id))
    ) {
      return;
    }

    addingIds.value = new Set([...addingIds.value, ...ids]);
    try {
      return await addSelectedAsync(payload);
    } finally {
      const next = new Set(addingIds.value);
      ids.forEach((id) => next.delete(id));
      addingIds.value = next;
    }
  }

  async function addAll(filters: PaymentListFilterInput) {
    if (addingAllLock.value || addingIds.value.size > 0) return;
    addingAllLock.value = true;
    try {
      return await addAllAsync(filters);
    } finally {
      addingAllLock.value = false;
    }
  }

  async function clearCart(options: PaymentCartClearOptions = {}) {
    if (clearingLock.value) return;
    clearingLock.value = true;
    try {
      return await clearCartAsync(options);
    } finally {
      clearingLock.value = false;
    }
  }

  async function payCart(body: PaymentCartPayBody) {
    if (payingLock.value) return;
    payingLock.value = true;
    try {
      return await payCartAsync(body);
    } finally {
      payingLock.value = false;
    }
  }

  const isAdding = computed(
    () =>
      addingIds.value.size > 0
      || addingAllLock.value
      || addSelectedStatus.value === 'loading'
      || addAllStatus.value === 'loading',
  );

  const isAddingAll = computed(
    () => addingAllLock.value || addAllStatus.value === 'loading',
  );
  const isClearing = computed(
    () => clearingLock.value || clearStatus.value === 'loading',
  );
  const isPaying = computed(
    () => payingLock.value || payStatus.value === 'loading',
  );
  const isAddingRow = (id: number) => addingIds.value.has(id);

  return {
    cart,
    asyncStatus,
    errorMessage,
    isLoading,
    isAdding,
    isAddingAll,
    isAddingRow,
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
