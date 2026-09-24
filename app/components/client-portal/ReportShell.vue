<script setup lang="ts" generic="TSort extends string">
import { h, resolveComponent } from 'vue';
import { useMediaQuery } from '@vueuse/core';

/**
 * Estructura común de los reportes del portal. En desktop: barra con los
 * filtros generales (slot `filters`) + búsqueda, y la tabla (slot `desktop`).
 * En móvil: búsqueda, botón que abre los filtros en un drawer, orden rápido y
 * las tarjetas (slot `mobile`). El slot `actions` va junto al conteo.
 */
const props = defineProps<{
  searchPlaceholder: string;
  mobileSearchPlaceholder: string;
  countLabel: string;
  /** Filtros de columna / estado que se limpian con "Limpiar". */
  activeFilterCount: number;
  /** Total de filtros para el badge del botón móvil. */
  mobileFilterCount: number;
  sortItems: { label: string; value: TSort; icon?: string }[];
  isInitialLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isLoadingMore?: boolean;
  loadingMoreLabel?: string;
  filtersDescription?: string;
}>();

const emit = defineEmits<{
  clearFilters: [];
  retry: [];
}>();

const search = defineModel<string>('search', { required: true });
const sortKey = defineModel<TSort | undefined>('sort');

/** USelect no infiere bien el genérico; se le da como string. */
const selectItems = computed(
  () => props.sortItems as { label: string; value: string; icon?: string }[],
);
const sortValue = computed<string | undefined>({
  get: () => sortKey.value,
  set: (value) => {
    sortKey.value = value as TSort | undefined;
  },
});

const isDesktop = useMediaQuery('(min-width: 1024px)');
const isFiltersOpen = ref(false);

const UInput = resolveComponent('UInput');
const UButton = resolveComponent('UButton');

/** El mismo buscador vive en la barra de filtros (desktop) o sobre las tarjetas (móvil). */
const SearchField = defineComponent(() => () =>
  h(
    UInput,
    {
      modelValue: search.value,
      'onUpdate:modelValue': (value: string) => {
        search.value = value;
      },
      icon: 'i-lucide-search',
      class: 'w-full min-w-0 flex-1',
      placeholder: isDesktop.value
        ? props.searchPlaceholder
        : props.mobileSearchPlaceholder,
      ui: { base: 'bg-default' },
    },
    search.value
      ? {
          trailing: () =>
            h(UButton, {
              color: 'neutral',
              variant: 'link',
              size: 'xs',
              icon: 'i-lucide-x',
              'aria-label': 'Limpiar búsqueda',
              onClick: () => {
                search.value = '';
              },
            }),
        }
      : undefined,
  ),
);
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <div
      v-if="isDesktop"
      class="flex flex-wrap items-start gap-x-6 gap-y-3 rounded-xl border border-default bg-default p-4"
    >
      <slot name="filters" />

      <div class="ms-auto flex min-w-56 max-w-96 flex-1 flex-col gap-1">
        <p class="text-[11px] font-medium uppercase tracking-wider text-muted">
          Buscar
        </p>
        <SearchField />
      </div>
    </div>

    <PendingInvoiceTableFullscreenSection>
      <template #toolbar="{ isFullscreen, toggle }">
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div
            v-if="!isDesktop"
            class="flex items-center gap-2"
          >
            <SearchField />

            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-sliders-horizontal"
              :label="mobileFilterCount > 0 ? `Filtros · ${mobileFilterCount}` : 'Filtros'"
              class="shrink-0 bg-default"
              @click="isFiltersOpen = true"
            />
          </div>

          <div class="flex items-center gap-2 lg:ms-auto">
            <USelect
              v-if="!isDesktop && sortItems.length > 0"
              v-model="sortValue"
              :items="selectItems"
              placeholder="Ordenar"
              icon="i-lucide-arrow-up-down"
              size="sm"
              variant="ghost"
              class="-ms-2"
            />

            <UButton
              v-if="activeFilterCount > 0"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-lucide-filter-x"
              :label="isDesktop ? `Limpiar filtros de columna (${activeFilterCount})` : 'Limpiar'"
              @click="emit('clearFilters')"
            />

            <p class="ms-auto whitespace-nowrap text-sm text-muted tabular-nums lg:ms-0">
              {{ countLabel }}
            </p>

            <slot name="actions" />

            <UButton
              v-if="isDesktop"
              color="neutral"
              variant="ghost"
              size="sm"
              :icon="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
              :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
              :title="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'"
              @click="toggle"
            />
          </div>
        </div>
      </template>

      <div
        v-if="isInitialLoading"
        class="flex flex-col gap-2"
      >
        <USkeleton
          v-for="index in 6"
          :key="index"
          class="h-14 w-full rounded-xl"
        />
      </div>

      <div
        v-else-if="isError"
        class="flex min-h-48 flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-default bg-default p-6 text-center"
      >
        <UIcon
          name="i-lucide-cloud-off"
          class="size-8 text-dimmed"
        />
        <p class="text-sm text-muted">
          {{ errorMessage || 'No se pudo cargar el reporte.' }}
        </p>
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-refresh-cw"
          label="Reintentar"
          @click="emit('retry')"
        />
      </div>

      <template v-else>
        <slot
          v-if="isDesktop"
          name="desktop"
        />
        <slot
          v-else
          name="mobile"
        />

        <p
          v-if="isLoadingMore"
          class="flex items-center justify-center gap-2 py-1 text-xs text-muted"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-3.5 animate-spin"
          />
          {{ loadingMoreLabel ?? 'Cargando más…' }}
        </p>
      </template>
    </PendingInvoiceTableFullscreenSection>

    <UDrawer
      v-if="!isDesktop"
      v-model:open="isFiltersOpen"
      title="Filtros"
      :description="filtersDescription"
      :ui="{ body: 'flex flex-col gap-5 pb-2' }"
    >
      <template #body>
        <slot name="filters" />
      </template>
      <template #footer>
        <UButton
          block
          size="lg"
          label="Ver resultados"
          @click="isFiltersOpen = false"
        />
      </template>
    </UDrawer>
  </div>
</template>
