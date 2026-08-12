<script setup lang="ts">
const { companies, selectedCompanies, clearCompanies } = usePendingInvoiceList();

const open = ref(false);

const options = computed(() =>
  companies.value.map(compania => ({ value: compania, label: compania })),
);

const triggerLabel = computed(() => {
  const count = selectedCompanies.value.length;
  if (count === 0) return 'Filtrar por compañía';
  if (count === 1) return selectedCompanies.value[0] as string;
  return `${count} compañías`;
});
</script>

<template>
  <div class="flex items-center gap-1">
    <UPopover
      v-model:open="open"
      :content="{ align: 'end' }"
      :ui="{ content: 'w-72 p-3' }"
    >
      <UButton
        color="neutral"
        :variant="selectedCompanies.length > 0 ? 'subtle' : 'outline'"
        icon="i-lucide-building-2"
        trailing-icon="i-lucide-chevron-down"
        class="max-w-64"
        :ui="{ label: 'truncate' }"
      >
        <span class="truncate">{{ triggerLabel }}</span>
      </UButton>

      <template #content>
        <div class="flex flex-col gap-2">
          <p class="text-xs font-semibold text-highlighted">
            Compañía
          </p>
          <p class="text-[11px] text-dimmed">
            Aplica a los tres tabs a la vez.
          </p>
          <PendingInvoiceFilterValueList
            :options="options"
            :selected="selectedCompanies"
            search-placeholder="Buscar compañía…"
            @update:selected="selectedCompanies = $event"
          />
        </div>
      </template>
    </UPopover>

    <UButton
      v-if="selectedCompanies.length > 0"
      color="neutral"
      variant="ghost"
      icon="i-lucide-x"
      aria-label="Quitar filtro de compañía"
      @click="clearCompanies"
    />
  </div>
</template>
