<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import type { TableColumn, TableRow } from '@nuxt/ui';
import type { PaymentRecipientType } from '~/constants/payment-api';
import { PAYMENT_RECIPIENT_TYPE_OPTIONS } from '~/constants/payment-api';
import type { PaymentReceiptListItem } from '~/interfaces/payment/receipt';
import { adminListTableClass } from '~/constants/admin-list-layout';
import {
  compareCalendarDateParts,
  minCalendarDateParts,
  todayCalendarDateParts,
} from '~/utils/payment-list-query';

useHead({
  title: 'Comprobantes de pago',
});

const maxSelectableDate = todayCalendarDateParts();

const UBadge = resolveComponent('UBadge');

const tableRef = useTemplateRef('table');

const { fetchOperativeDropdown, fetchSellerDropdown } =
  usePaymentBoardFetchers();

const {
  canFilterByRecipient,
  paymentType,
  userId,
  fromDate,
  toDate,
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
} = usePaymentReceiptList();

usePaginatedTableInfiniteScroll({
  tableRef,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const receiptTypeOptions: {
  label: string;
  value: PaymentRecipientType | null;
}[] = [{ label: 'Todos', value: null }, ...PAYMENT_RECIPIENT_TYPE_OPTIONS];

const userDropdownFetcher = computed(() => {
  if (paymentType.value === 'seller') return fetchSellerDropdown;
  return fetchOperativeDropdown;
});

const userFieldLabel = computed(() => {
  if (paymentType.value === 'seller') return 'Vendedor';
  if (paymentType.value === 'operative') return 'Operador';
  return 'Operador / Vendedor';
});

const userPlaceholder = computed(() => {
  if (paymentType.value === 'seller') return 'Filtrar por vendedor';
  if (paymentType.value === 'operative') return 'Filtrar por operador';
  return 'Selecciona tipo para filtrar usuario';
});

const userFilterDisabled = computed(() => paymentType.value == null);

const fromDateMax = computed(() =>
  toDate.value != null
    ? minCalendarDateParts(toDate.value, maxSelectableDate)
    : maxSelectableDate,
);

const toDateMin = computed(() => fromDate.value ?? undefined);

watch(fromDate, (from) => {
  if (from == null) return;
  if (compareCalendarDateParts(from, maxSelectableDate) > 0) {
    fromDate.value = maxSelectableDate;
    return;
  }
  if (toDate.value != null && compareCalendarDateParts(from, toDate.value) > 0) {
    toDate.value = from;
  }
});

watch(toDate, (to) => {
  if (to == null) return;
  if (compareCalendarDateParts(to, maxSelectableDate) > 0) {
    toDate.value = maxSelectableDate;
    return;
  }
  if (fromDate.value != null && compareCalendarDateParts(to, fromDate.value) < 0) {
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

function voucherCountLabel(row: PaymentReceiptListItem): string {
  const count = row.operative_count + row.seller_count;
  return `${count} voucher${count === 1 ? '' : 's'}`;
}

function onRowSelect(_e: Event, row: TableRow<PaymentReceiptListItem>) {
  void navigateTo(`/admin/pagar/recibo/${row.original.id}`);
}

const columns: TableColumn<PaymentReceiptListItem>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) =>
      h('span', { class: 'font-medium text-primary' }, `#${row.original.id}`),
  },
  {
    id: 'payment_type',
    header: 'Tipo',
    cell: ({ row }) =>
      h(UBadge, {
        color: 'primary',
        variant: 'subtle',
        size: 'sm',
        label: paymentCheckoutRecipientLabel(row.original.payment_type),
      }),
  },
  {
    id: 'total_amount',
    header: 'Total',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'tabular-nums font-medium' },
        formatRescueCardMoney(row.original.total_amount),
      ),
  },
  {
    id: 'vouchers',
    header: 'Comisiones',
    cell: ({ row }) =>
      h('span', { class: 'text-muted' }, voucherCountLabel(row.original)),
  },
  {
    id: 'debt_count',
    header: 'Deudas',
    cell: ({ row }) => h('span', String(row.original.debt_count)),
  },
  {
    accessorKey: 'created_by',
    header: 'Registrado por',
    cell: ({ row }) => h('span', row.original.created_by),
  },
  {
    id: 'created_at',
    header: 'Fecha',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-muted' },
        formatPaymentDate(row.original.created_at),
      ),
  },
];
</script>

<template>
  <AdminListPageShell
    navbar-title="Comprobantes"
    title="Comprobantes de pago"
    description="Historial de comprobantes de pago registrados"
  >
    <template #filters>
      <div
        class="grid w-full gap-3 sm:grid-cols-2"
        :class="
          canFilterByRecipient
            ? 'lg:grid-cols-3 xl:grid-cols-5'
            : 'lg:grid-cols-2'
        "
      >
        <UFormField v-if="canFilterByRecipient" label="Tipo">
          <USelect
            v-model="paymentType"
            :items="receiptTypeOptions"
            value-key="value"
            label-key="label"
            class="w-full"
            variant="subtle"
            :ui="{ base: 'bg-default' }"
          />
        </UFormField>

        <UFormField
          v-if="canFilterByRecipient"
          :label="userFieldLabel"
          class="sm:col-span-2"
        >
          <CatalogDropdownSelect
            v-model="userId"
            class="w-full"
            :placeholder="userPlaceholder"
            :fetcher="userDropdownFetcher"
            :disabled="userFilterDisabled"
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

    <div
      v-if="isInitialLoading"
      class="flex flex-1 items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="rows.length === 0"
      class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-default p-8 text-center text-sm text-muted"
    >
      Sin comprobantes para los filtros seleccionados.
    </div>

    <UTable
      v-else
      ref="table"
      sticky
      :class="adminListTableClass"
      :columns="columns"
      :data="rows"
      :get-row-id="(row: PaymentReceiptListItem) => String(row.id)"
      @select="onRowSelect"
    />
  </AdminListPageShell>
</template>
