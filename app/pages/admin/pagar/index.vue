<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn } from '@nuxt/ui';
import { today, getLocalTimeZone } from '@internationalized/date';
import type { CalendarDate } from '@internationalized/date';
import { PAYMENT_RECIPIENT_TYPE_OPTIONS } from '~/constants/payment-api';
import type { PaymentListItem } from '~/interfaces/payment/payment-list';
import { adminListTableClass } from '~/constants/admin-list-layout';

useHead({
  title: 'Pagar',
});

const maxSelectableDate = today(getLocalTimeZone());

function minCalendarDate(a: CalendarDate, b: CalendarDate): CalendarDate {
  return a.compare(b) <= 0 ? a : b;
}

const UBadge = resolveComponent('UBadge');
const UButton = resolveComponent('UButton');
const UCheckbox = resolveComponent('UCheckbox');
const UTooltip = resolveComponent('UTooltip');

const tableRef = useTemplateRef('table');
const toast = useToast();

const { fetchOperativeDropdown, fetchSellerDropdown } = usePaymentBoardFetchers();

const {
  recipientType,
  userId,
  folio,
  fromDate,
  toDate,
  appliedFilters,
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
  hasSearched,
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
  cart,
  isLoading: cartLoading,
  isAdding,
  isClearing,
  cartItemIds,
  addSelected,
  addAll,
  clearCart,
} = usePaymentCart();

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
  if (row == null) return;

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

  const ids = rows.value.map((row) => row.id);
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
    await addAll(appliedFilters.value);
    selectAllVisible();
  } catch {
    // El toast de error lo muestra usePaymentCart.
  }
}

async function onClearCart() {
  await clearCart();
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
      .filter((row) => inCart.has(row.id))
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

const operationalDetailModalMounted = ref(false);
const administrativeDetailModalMounted = ref(false);
const operationalDetailModalRef = ref<{ open: (id: number) => void } | null>(
  null,
);
const administrativeDetailModalRef = ref<{
  open: (id: number) => void;
} | null>(null);
const pendingDetailOpen = ref<{
  id: number;
  type: 'operative' | 'seller';
} | null>(null);

function openRescueDetail(row: PaymentListItem) {
  if (row.rescue_id == null) return;

  if (recipientType.value === 'operative') {
    if (operationalDetailModalMounted.value) {
      operationalDetailModalRef.value?.open(row.rescue_id);
      return;
    }
    pendingDetailOpen.value = { id: row.rescue_id, type: 'operative' };
    operationalDetailModalMounted.value = true;
    return;
  }

  if (administrativeDetailModalMounted.value) {
    administrativeDetailModalRef.value?.open(row.rescue_id);
    return;
  }
  pendingDetailOpen.value = { id: row.rescue_id, type: 'seller' };
  administrativeDetailModalMounted.value = true;
}

watch(operationalDetailModalRef, (modal) => {
  if (
    modal
    && pendingDetailOpen.value?.type === 'operative'
  ) {
    modal.open(pendingDetailOpen.value.id);
    pendingDetailOpen.value = null;
  }
});

watch(administrativeDetailModalRef, (modal) => {
  if (
    modal
    && pendingDetailOpen.value?.type === 'seller'
  ) {
    modal.open(pendingDetailOpen.value.id);
    pendingDetailOpen.value = null;
  }
});

const columns = computed((): TableColumn<PaymentListItem>[] => {
  const adding = isAdding.value;

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
        disabled: adding,
        ariaLabel: 'Seleccionar todas las filas visibles',
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: isRowSelected(row.original.id),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          void onRowCheck(row.original.id, value === true),
        disabled: adding,
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
    accessorKey: 'rescue_folio',
    header: 'Folio',
    cell: ({ row }) =>
      h('span', { class: 'font-medium' }, row.original.rescue_folio),
  },
  {
    id: 'name',
    header: recipientType.value === 'operative' ? 'Operador' : 'Vendedor',
    cell: ({ row }) => h('span', recipientName(row.original)),
  },
  {
    id: 'awn_date',
    header: 'Activo sin cotizar',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        row.original.awn_date != null
          ? formatPaymentDate(row.original.awn_date)
          : '—',
      ),
  },
  {
    id: 'debt_created_at',
    header: 'Fecha creación deuda',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        row.original.debt_created_at != null
          ? formatPaymentDate(row.original.debt_created_at)
          : formatPaymentDate(row.original.created_at),
      ),
  },
  {
    id: 'paid_at',
    header: 'Fecha de pago',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        row.original.paid_at != null
          ? formatPaymentDate(row.original.paid_at)
          : '—',
      ),
  },
  {
    id: 'client_name',
    header: 'Compañía',
    cell: ({ row }) =>
      h(
        'span',
        row.original.client_name != null
          ? formatOptionalCell(row.original.client_name)
          : '—',
      ),
  },
  {
    id: 'amount',
    header: 'Cantidad',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'tabular-nums' },
        formatRescueCardMoney(row.original.amount),
      ),
  },
  {
    id: 'payment',
    header: '¿Pagado?',
    cell: ({ row }) =>
      h(UBadge, {
        color: row.original.payment ? 'success' : 'neutral',
        variant: 'subtle',
        size: 'sm',
        label: row.original.payment ? 'Sí' : 'No',
      }),
  },
  {
    id: 'rescue',
    header: 'Rescate',
    cell: ({ row }) => {
      const hasRescue = row.original.rescue_id != null;

      const button = h(UButton, {
        size: 'xs',
        color: 'primary',
        variant: 'ghost',
        label: 'Ver',
        icon: 'i-lucide-external-link',
        disabled: !hasRescue,
        onClick: () => openRescueDetail(row.original),
      });

      if (hasRescue) return button;

      return h(
        UTooltip,
        { text: 'Próximamente' },
        () => button,
      );
    },
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
      <div class="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      <div class="w-full shrink-0 lg:w-80">
        <PaymentCartSummaryPanel
          :cart="cart"
          :loading="cartLoading"
          :clearing="isClearing"
          @clear="onClearCart"
          @checkout="onCheckout"
        />
      </div>
    </div>

    <LazyOperationalRescueDetailModal
      v-if="operationalDetailModalMounted"
      ref="operationalDetailModalRef"
    />
    <LazyAdministrativeRescueDetailModal
      v-if="administrativeDetailModalMounted"
      ref="administrativeDetailModalRef"
    />
  </AdminListPageShell>
</template>
