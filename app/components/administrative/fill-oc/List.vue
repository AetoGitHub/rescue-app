<script setup lang="ts">
import { FILL_OC_LABELS } from '~/constants/fill-oc-api';

const props = defineProps<{
  apiKey: string;
}>();

const {
  items,
  isInitialLoading,
  isError,
  isUnauthorized,
  errorMessage,
  refresh,
} = useFillOcList(() => props.apiKey);

const search = ref('');
const savedIds = ref<number[]>([]);

/** Un refetch en segundo plano no debe revivir una tarjeta ya guardada. */
const pendingItems = computed(() =>
  items.value.filter((item) => !savedIds.value.includes(item.id)),
);

const visibleItems = computed(() =>
  pendingItems.value.filter((item) => matchesFillOcSearch(item, search.value)),
);

const hasSearch = computed(() => search.value.trim() !== '');
const showSearch = computed(
  () => pendingItems.value.length > 1 || hasSearch.value,
);

const pendingCountLabel = computed(() => {
  const count = pendingItems.value.length;
  const noun =
    count === 1 ? FILL_OC_LABELS.pendingCountSingular : FILL_OC_LABELS.pendingCount;
  return `${count} ${noun}`;
});

function onSaved(id: number) {
  savedIds.value = [...savedIds.value, id];
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col">
    <header
      class="sticky top-0 z-10 space-y-3 border-b border-default bg-muted/80 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 backdrop-blur-md"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Órdenes de compra
          </p>
          <h1 class="text-xl font-semibold text-highlighted">
            {{ FILL_OC_LABELS.pageTitle }}
          </h1>
        </div>

        <UBadge
          v-if="!isInitialLoading && !isError"
          color="neutral"
          variant="subtle"
          class="shrink-0 tabular-nums"
          :label="pendingCountLabel"
        />
      </div>

      <UInput
        v-if="showSearch"
        v-model="search"
        icon="i-lucide-search"
        variant="subtle"
        size="lg"
        class="w-full"
        :placeholder="FILL_OC_LABELS.searchPlaceholder"
        :ui="{ base: 'bg-default' }"
      >
        <template
          v-if="hasSearch"
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
    </header>

    <div class="px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div
        v-if="isInitialLoading"
        class="space-y-3"
      >
        <USkeleton
          v-for="index in 3"
          :key="index"
          class="h-56 w-full rounded-xl"
        />
      </div>

      <AdministrativeFillOcStateMessage
        v-else-if="isUnauthorized"
        icon="i-lucide-shield-x"
        tone="error"
        :title="FILL_OC_LABELS.unauthorizedTitle"
        :description="FILL_OC_LABELS.unauthorizedDescription"
      />

      <AdministrativeFillOcStateMessage
        v-else-if="isError"
        icon="i-lucide-triangle-alert"
        tone="error"
        :title="FILL_OC_LABELS.loadErrorTitle"
        :description="errorMessage"
      >
        <template #action>
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-refresh-cw"
            :label="FILL_OC_LABELS.retryButton"
            @click="() => void refresh()"
          />
        </template>
      </AdministrativeFillOcStateMessage>

      <AdministrativeFillOcStateMessage
        v-else-if="pendingItems.length === 0"
        icon="i-lucide-check-check"
        tone="success"
        :title="FILL_OC_LABELS.empty"
        :description="FILL_OC_LABELS.emptyDescription"
      />

      <AdministrativeFillOcStateMessage
        v-else-if="visibleItems.length === 0"
        icon="i-lucide-search-x"
        :title="FILL_OC_LABELS.noSearchResults"
        :description="FILL_OC_LABELS.noSearchResultsDescription"
      />

      <TransitionGroup
        v-else
        tag="div"
        class="relative space-y-3"
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 motion-safe:translate-y-1"
        leave-active-class="absolute inset-x-0 transition duration-300 ease-out"
        leave-to-class="opacity-0 motion-safe:scale-95"
        move-class="transition duration-300 ease-out"
      >
        <AdministrativeFillOcCard
          v-for="item in visibleItems"
          :key="item.id"
          :item="item"
          :api-key="apiKey"
          @saved="onSaved"
        />
      </TransitionGroup>
    </div>
  </div>
</template>
