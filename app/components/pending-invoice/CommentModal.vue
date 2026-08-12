<script setup lang="ts">
import type { PendingInvoiceRow } from '~/interfaces/invoicing/pending-invoice';

const props = defineProps<{
  row: PendingInvoiceRow | null;
}>();

const open = defineModel<boolean>('open', { required: true });

const rescueId = computed(() => props.row?.id ?? null);
</script>

<template>
  <UModal
    v-model:open="open"
    :title="row?.folio ?? 'Chat'"
    :description="row ? `${row.compania} · ${row.unidad}` : undefined"
    :ui="{
      content: 'max-w-lg sm:max-w-xl',
      body: 'min-h-0 p-0 sm:p-0',
    }"
  >
    <template #body>
      <div class="flex h-[min(70vh,560px)] min-h-80 flex-col p-4">
        <OperationalRescueDetailChat
          v-if="rescueId != null"
          :rescue-id="rescueId"
          layout="sidebar"
        />
        <p
          v-else
          class="py-12 text-center text-sm text-muted"
        >
          No se pudo abrir el chat de este folio.
        </p>
      </div>
    </template>
  </UModal>
</template>
