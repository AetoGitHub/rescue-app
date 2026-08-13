<script setup lang="ts">
import { PENDING_INVOICE_SEARCH_PLACEHOLDER } from '~/constants/pending-invoice';
import { formatPendingInvoiceMoney } from '~/utils/pending-invoice-display';

const props = defineProps<{
  eventCount: number;
  total: number;
  activeFilterCount: number;
}>();

const emit = defineEmits<{
  clearFilters: [];
}>();

const search = defineModel<string>('search', { required: true });

const summaryLabel = computed(
  () =>
    `${props.eventCount} evento${props.eventCount === 1 ? '' : 's'} · ${formatPendingInvoiceMoney(props.total)} c/IVA`,
);

// ZIP por compañía — deshabilitado de momento (endpoint/flujo pendiente).
// import { PENDING_INVOICE_ZIP_TOAST } from '~/constants/pending-invoice';
// const toast = useToast();
// function onDownloadZip() {
//   toast.add({
//     title: PENDING_INVOICE_ZIP_TOAST.title,
//     description: PENDING_INVOICE_ZIP_TOAST.description,
//     icon: 'i-lucide-file-archive',
//     color: 'neutral',
//   });
// }
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
    <UInput
      v-model="search"
      icon="i-lucide-search"
      variant="subtle"
      class="w-full sm:max-w-md"
      :placeholder="PENDING_INVOICE_SEARCH_PLACEHOLDER"
      :ui="{ base: 'bg-default' }"
    >
      <template
        v-if="search"
        #trailing
      >
        <UButton
          color="neutral"
          variant="link"
          size="xs"
          icon="i-lucide-x"
          aria-label="Limpiar búsqueda"
          @click="search = ''"
        />
      </template>
    </UInput>

    <UButton
      v-if="activeFilterCount > 0"
      color="neutral"
      variant="subtle"
      icon="i-lucide-filter-x"
      :label="`Limpiar filtros (${activeFilterCount})`"
      @click="emit('clearFilters')"
    />

    <div class="flex items-center gap-3 sm:ms-auto">
      <p class="text-sm whitespace-nowrap text-muted">
        {{ summaryLabel }}
      </p>
      <!--
      <UButton
        color="primary"
        icon="i-lucide-file-archive"
        label="Descargar ZIP por compañía"
        class="whitespace-nowrap"
        @click="onDownloadZip"
      />
      -->
    </div>
  </div>
</template>
