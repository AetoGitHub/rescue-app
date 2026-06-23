<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { today, getLocalTimeZone } from '@internationalized/date';
import type { CalendarDate } from '@internationalized/date';
import { PAYMENT_RECIPIENT_TYPE_OPTIONS, PAYMENT_LIST_PAYMENT_OPTIONS } from '~/constants/payment-api';
import type { PaymentListItem } from '~/interfaces/payment/payment-list';
import { adminListTableClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Pagar',
});

const isDev = import.meta.dev;
const maxSelectableDate = today(getLocalTimeZone());

function minCalendarDate(a: CalendarDate, b: CalendarDate): CalendarDate {
  return a.compare(b) <= 0 ? a : b;
}

const UBadge = resolveComponent('UBadge');
const UCheckbox = resolveComponent('UCheckbox');

const tableRef = useTemplateRef('table');
const toast = useToast();

const { fetchOperativeDropdown, fetchSellerDropdown } = usePaymentBoardFetchers();

const {
  recipientType,
  userId,
  folio,
  fromDate,
  toDate,
  paymentStatus,
  appliedFilters,
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
  hasSearched,
  selectableRows,
  selectedIdList,
  allVisibleSelected,
  someVisibleSelected,
  clearSelection,
  selectAllVisible,
  deselectAllVisible,
  selectIds,
  toggleRow,
  isRowSelected,
} = usePaymentList();

const {
  testDaysInput,
  appliedTestDays,
  applyTestDaysSimulation,
  clearTestDaysSimulation,
} = usePaymentCartTestDays();

const {
  cart,
  isLoading: cartLoading,
  isAdding,
  isClearing,
  cartItemIds,
  addSelected,
  addAll,
  clearCart,
  refresh: refreshCart,
} = usePaymentCart(appliedTestDays);

const { recipient, clearRecipient } = usePaymentCheckoutRecipient();

watch(appliedTestDays, () => {
  void refreshCart();
});

function cartHasItems(): boolean {
  return cart.value != null && paymentCartItemCount(cart.value) > 0;
}

function selectionMatchesCart(): boolean {
  if (!cartHasItems()) return true;
  if (userId.value == null) return true;

  const active = resolveActivePaymentCart(cart.value!);
  if (active == null || isInvalidPaymentCart(active)) return false;

  return (
    active.type === recipientType.value
    && recipient.value?.userId === userId.value
  );
}

async function resetCartForContextChange() {
  clearSelection();

  if (cartHasItems()) {
    try {
      await clearCart({ quiet: true });
    } catch {
      // El toast de error lo muestra usePaymentCart.
    }
    return;
  }

  clearRecipient();
}

watch(recipientType, async (_newType, oldType) => {
  if (oldType === undefined) return;
  if (!cartHasItems()) {
    clearRecipient();
    clearSelection();
    return;
  }
  await resetCartForContextChange();
});

watch(userId, async (newId, oldId) => {
  if (oldId === undefined) return;
  if (newId === oldId) return;

  if (newId == null && oldId != null) {
    await resetCartForContextChange();
    return;
  }

  if (selectionMatchesCart()) return;
  await resetCartForContextChange();
});

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const userDropdownFetcher = computed(() =>
  recipientType.value === 'operative'
    ? fetchOperativeDropdown
    : fetchSellerDropdown,
);

const userPlaceholder = computed(() =>
  recipientType.value === 'operative'
    ? 'Seleccionar operador'
    : 'Seleccionar vendedor',
);

const userFieldLabel = computed(() =>
  recipientType.value === 'operative' ? 'Operador' : 'Vendedor',
);

const fromDateMax = computed(() =>
  toDate.value != null
    ? minCalendarDate(toDate.value, maxSelectableDate)
    : maxSelectableDate,
);

const toDateMin = computed(() => fromDate.value ?? undefined);

watch(fromDate, (from) => {
  if (from == null) return;
  if (from.compare(maxSelectableDate) > 0) {
    fromDate.value = maxSelectableDate;
    return;
  }
  if (toDate.value != null && from.compare(toDate.value) > 0) {
    toDate.value = from;
  }
});

watch(toDate, (to) => {
  if (to == null) return;
  if (to.compare(maxSelectableDate) > 0) {
    toDate.value = maxSelectableDate;
    return;
  }
  if (fromDate.value != null && to.compare(fromDate.value) < 0) {
    fromDate.value = to;
  }
});

function formatPaymentDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatOptionalCell(value: string | null | undefined): string {
  return value?.trim() ? value : '—';
}

function recipientName(row: PaymentListItem): string {
  if (appliedFilters.value.type === 'operative') {
    return formatOptionalCell(row.operator_name);
  }
  return formatOptionalCell(row.seller_name ?? row.operator_name);
}

function paymentUserNameFromRow(row: PaymentListItem): string | null {
  if (appliedFilters.value.type === 'operative') {
    return row.operator_name?.trim() || null;
  }
  return row.seller_name?.trim() || row.operator_name?.trim() || null;
}

async function onRowCheck(id: number, checked: boolean) {
  if (!checked) {
    toggleRow(id, false);
    return;
  }

  const row = rows.value.find((item) => item.id === id);
  if (row == null || !isPaymentListRowSelectable(row)) return;

  try {
    await addSelected({
      type: appliedFilters.value.type,
      ids: [id],
      userId: appliedFilters.value.userId,
      userName: paymentUserNameFromRow(row),
    });
    toggleRow(id, true);
  } catch {
    // El toast de error lo muestra usePaymentCart; el check queda desmarcado.
  }
}

async function onToggleAllVisible(checked: boolean) {
  if (!checked) {
    deselectAllVisible();
    return;
  }

  const ids = rows.value
    .filter((row) => isPaymentListRowSelectable(row))
    .map((row) => row.id);
  if (ids.length === 0) return;

  try {
    await addSelected({
      type: appliedFilters.value.type,
      ids,
      quiet: true,
      userId: appliedFilters.value.userId,
      userName: rows.value[0] ? paymentUserNameFromRow(rows.value[0]) : null,
    });
    selectAllVisible();
    toast.add({
      title: 'Agregado al carrito',
      color: 'success',
    });
  } catch {
    // El toast de error lo muestra usePaymentCart.
  }
}

async function onAddAll() {
  if (appliedFilters.value.userId == null) {
    toast.add({
      title: 'Selecciona un usuario para ver deudas',
      color: 'warning',
    });
    return;
  }

  try {
    await addAll({
      ...appliedFilters.value,
      payment: appliedFilters.value.payment ?? false,
    });
    selectAllVisible();
  } catch {
    // El toast de error lo muestra usePaymentCart.
  }
}

async function onClearCart() {
  await clearCart({});
  clearSelection();
}

const selectionTableKey = computed(
  () => `${rows.value.length}-${selectedIdList.value.join(',')}`,
);

watch(
  [cart, rows, () => appliedFilters.value.type],
  () => {
    if (!hasSearched.value) return;

    const inCart = cartItemIds(appliedFilters.value.type);
    const visibleInCart = rows.value
      .filter((row) => inCart.has(row.id) && isPaymentListRowSelectable(row))
      .map((row) => row.id);

    if (visibleInCart.length > 0) {
      selectIds(visibleInCart);
    }
  },
  { immediate: true },
);

function onCheckout() {
  if (cart.value == null || paymentCartItemCount(cart.value) === 0) {
    toast.add({
      title: 'Carrito vacío',
      description: 'Agrega deudas al carrito antes de proceder con el pago.',
      color: 'warning',
    });
    return;
  }

  const activeCart = resolveActivePaymentCart(cart.value);
  if (activeCart != null && isInvalidPaymentCart(activeCart)) {
    toast.add({
      title: 'Respuesta inválida del carrito',
      description:
        'El carrito devolvió operadores y vendedores a la vez. Vacía el carrito e inténtalo de nuevo.',
      color: 'error',
    });
    return;
  }

  const summary = resolvePaymentCartRecipientSummary(cart.value);
  const { recipient, setRecipient } = usePaymentCheckoutRecipient();

  if (summary != null) {
    const userId =
      recipient.value?.type === summary.type
        ? recipient.value.userId
        : appliedFilters.value.userId;

    if (userId != null) {
      setRecipient({
        type: summary.type,
        userId,
        userName: summary.userName,
      });
    }
  }

  void navigateTo('/admin/pagar/checkout');
}

const columns = computed((): TableColumn<PaymentListItem>[] => {
  const adding = isAdding.value;
  const profileType = recipientType.value;
  const hasSelectableRows = selectableRows.value.length > 0;

  return [
    {
      id: 'select',
      header: () =>
        h(UCheckbox, {
          modelValue: allVisibleSelected.value
            ? true
            : someVisibleSelected.value
              ? 'indeterminate'
              : false,
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            void onToggleAllVisible(value === true),
          disabled: adding || !hasSelectableRows,
          ariaLabel: 'Seleccionar todas las filas visibles',
        }),
      cell: ({ row }) =>
        h(UCheckbox, {
          modelValue: isRowSelected(row.original.id),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            void onRowCheck(row.original.id, value === true),
          disabled: adding || row.original.payment,
          ariaLabel: `Seleccionar deuda ${row.original.rescue_folio}`,
        }),
      meta: {
        class: {
          th: 'w-10',
          td: 'w-10',
        },
      },
    },
    {
      id: 'name',
      header: profileType === 'operative' ? 'Operador' : 'Vendedor',
      cell: ({ row }) => h('span', recipientName(row.original)),
    },
    {
      accessorKey: 'rescue_folio',
      header: 'Folio',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'font-medium text-primary' },
          row.original.rescue_folio,
        ),
    },
    {
      id: 'client_name',
      header: 'Cliente',
      cell: ({ row }) =>
        h('span', formatOptionalCell(row.original.client_name)),
    },
    {
      id: 'service_type',
      header: 'Tipo',
      cell: ({ row }) => {
        const badge = getRescueServiceTypeBadge(row.original.service_type);
        return h(UBadge, {
          color: badge.color,
          variant: 'subtle',
          size: 'sm',
          label: badge.label,
        });
      },
    },
    {
      id: 'created_at',
      header: 'Cierre',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-muted' },
          formatPaymentDate(row.original.created_at),
        ),
    },
    {
      id: 'profit',
      header: 'Utilidad',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'tabular-nums text-primary' },
          formatRescueCardMoney(row.original.profit),
        ),
    },
    {
      id: 'commission_rate',
      header: 'Tasa',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'tabular-nums' },
          paymentListCommissionRate(row.original, profileType),
        ),
    },
    {
      id: 'amount',
      header: 'Comisión',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'tabular-nums text-primary' },
          formatRescueCardMoney(row.original.amount),
        ),
    },
    {
      id: 'payment',
      header: 'Estatus',
      cell: ({ row }) =>
        h(UBadge, {
          color: row.original.payment ? 'success' : 'warning',
          variant: 'subtle',
          size: 'sm',
          label: row.original.payment ? 'Pagado' : 'Pendiente',
        }),
    },
  ];
});
</script>

<template>
  <AdminListPageShell
    navbar-title="Pagar"
    title="Pagar"
    description="Consulta deudas de operadores y vendedores, agrégalas al carrito y prepara el pago"
  >
    <template #filters>
      <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <UFormField label="Tipo">
          <USelect
            v-model="recipientType"
            :items="PAYMENT_RECIPIENT_TYPE_OPTIONS"
            value-key="value"
            label-key="label"
            class="w-full"
            variant="subtle"
            :ui="{ base: 'bg-default' }"
          />
        </UFormField>

        <UFormField
          :label="userFieldLabel"
          class="sm:col-span-2"
        >
          <CatalogDropdownSelect
            v-model="userId"
            class="w-full"
            :placeholder="userPlaceholder"
            :fetcher="userDropdownFetcher"
          />
        </UFormField>

        <UFormField label="Estatus pago">
          <USelect
            v-model="paymentStatus"
            :items="PAYMENT_LIST_PAYMENT_OPTIONS"
            value-key="value"
            label-key="label"
            class="w-full"
            variant="subtle"
            :ui="{ base: 'bg-default' }"
          />
        </UFormField>

        <UFormField label="Folio">
          <UInput
            v-model="folio"
            leading-icon="i-lucide-search"
            placeholder="Buscar folio"
            class="w-full"
            variant="subtle"
            :ui="{ base: 'bg-default' }"
          />
        </UFormField>

        <UFormField label="Desde">
          <SharedDateInput v-model="fromDate" :max-value="fromDateMax" />
        </UFormField>

        <UFormField label="Hasta">
          <SharedDateInput
            v-model="toDate"
            :min-value="toDateMin"
            :max-value="maxSelectableDate"
          />
        </UFormField>
      </div>
    </template>

    <div class="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            label="Agregar todos"
            icon="i-lucide-list-plus"
            color="primary"
            variant="soft"
            :loading="isAdding"
            :disabled="!hasSearched"
            @click="onAddAll"
          />
        </div>

        <div
          v-if="!hasSearched"
          class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-default p-8 text-center text-sm text-muted"
        >
          Selecciona un {{ recipientType === 'operative' ? 'operador' : 'vendedor' }} para ver deudas.
        </div>

        <UTable
          v-else
          :key="selectionTableKey"
          ref="table"
          sticky
          :class="adminListTableClass"
          :columns="columns"
          :data="rows"
          :loading="isInitialLoading"
          :get-row-id="(row: PaymentListItem) => String(row.id)"
        />
      </div>

      <div class="w-full shrink-0 lg:w-80 space-y-4">
        <UPageCard
          v-if="isDev"
          variant="subtle"
          :ui="{ body: 'flex flex-wrap items-end gap-3' }"
        >
          <div class="min-w-40 flex-1">
            <p
              class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted"
            >
              Simular días de penalización (dev)
            </p>
            <UInputNumber
              v-model="testDaysInput"
              inputmode="numeric"
              placeholder="Ej. 8"
              class="w-full"
              @keyup.enter="applyTestDaysSimulation"
            />
          </div>
          <UButton
            color="primary"
            icon="i-lucide-flask-conical"
            label="Simular"
            :loading="cartLoading"
            @click="applyTestDaysSimulation"
          />
          <UButton
            v-if="appliedTestDays != null"
            color="neutral"
            variant="ghost"
            label="Quitar simulación"
            @click="clearTestDaysSimulation"
          />
        </UPageCard>

        <UAlert
          v-if="isDev && appliedTestDays != null"
          color="warning"
          variant="subtle"
          icon="i-lucide-flask-conical"
          title="Modo prueba (dev)"
          :description="`Simulando ${appliedTestDays} día${appliedTestDays === 1 ? '' : 's'} de penalización en el carrito.`"
        />

        <PaymentCartSummaryPanel
          :cart="cart"
          :loading="cartLoading"
          :clearing="isClearing"
          @clear="onClearCart"
          @checkout="onCheckout"
        />
      </div>
    </div>
  </AdminListPageShell>
</template>
