<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui';
import { groupClientPortalClients } from '~/utils/client-portal-filter';

/**
 * Selector "por cliente" del portal: agrupa por compañía, busca en memoria y
 * solo aplica el filtro al presionar "Filtrar por cliente".
 */
const { appliedClientIds, apply, clear } = useClientPortalClientFilter();
const { options, isLoading, isError, errorMessage, refresh } =
  useClientPortalClientOptions();

/** Selección en edición; no filtra nada hasta que se aplica. */
const draftIds = ref<number[]>([...appliedClientIds.value]);
const searchTerm = ref('');

watch(appliedClientIds, (ids) => {
  draftIds.value = [...ids];
});

const items = computed<SelectMenuItem[][]>(() =>
  groupClientPortalClients(options.value, searchTerm.value).map(group => [
    { type: 'label', label: group.companyName },
    ...group.clients.map(client => ({ label: client.name, value: client.id })),
  ]),
);

function sameIds(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every(id => set.has(id));
}

const hasPendingChanges = computed(
  () => !sameIds(draftIds.value, appliedClientIds.value),
);
const hasAppliedFilter = computed(() => appliedClientIds.value.length > 0);

const triggerLabel = computed(() => {
  const count = draftIds.value.length;
  if (count === 0) return 'Selecciona clientes';
  if (count === 1) {
    const option = options.value.find(item => item.id === draftIds.value[0]);
    return option?.name ?? '1 cliente';
  }
  return `${count} clientes`;
});

function onApply() {
  apply(draftIds.value);
}

function onClear() {
  searchTerm.value = '';
  draftIds.value = [];
  clear();
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <p class="text-[11px] font-medium uppercase tracking-wider text-muted">
      Cliente
    </p>

    <div class="flex flex-wrap items-center gap-2">
      <USelectMenu
        v-model="draftIds"
        v-model:search-term="searchTerm"
        :items="items"
        value-key="value"
        multiple
        ignore-filter
        :loading="isLoading"
        :disabled="isError"
        :search-input="{ placeholder: 'Buscar cliente o compañía…' }"
        icon="i-lucide-users"
        class="w-64"
        :ui="{ content: 'min-w-72' }"
      >
        <span class="truncate">{{ triggerLabel }}</span>

        <template #empty>
          <span class="text-sm text-muted">Sin clientes</span>
        </template>
      </USelectMenu>

      <UButton
        color="primary"
        icon="i-lucide-filter"
        label="Filtrar por cliente"
        :disabled="!hasPendingChanges"
        @click="onApply"
      />

      <UButton
        v-if="hasAppliedFilter || draftIds.length > 0"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        label="Borrar filtro"
        @click="onClear"
      />
    </div>

    <p
      v-if="isError"
      class="flex items-center gap-1 text-xs text-error"
    >
      No se pudieron cargar los clientes: {{ errorMessage }}
      <UButton
        size="xs"
        variant="link"
        color="error"
        label="Reintentar"
        @click="() => void refresh()"
      />
    </p>
  </div>
</template>
