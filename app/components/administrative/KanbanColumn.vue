<script setup lang="ts" generic="T">
interface Props<T> {
  title: string;
  items: T[];
  accentColor: string;
  count: number;
  isInitialLoading?: boolean;
  isLoadingMore?: boolean;
  isError?: boolean;
  isLoadMoreError?: boolean;
  errorMessage?: string;
}

withDefaults(defineProps<Props<T>>(), {
  isInitialLoading: false,
  isLoadingMore: false,
  isError: false,
  isLoadMoreError: false,
  errorMessage: '',
});

const emit = defineEmits<{
  retry: [];
}>();

const scrollContainerRef = ref<HTMLElement | null>(null);

defineExpose({
  scrollContainerRef,
});
</script>

<template>
  <div
    class="flex h-full min-h-0 w-[300px] shrink-0 flex-col rounded-lg bg-muted/30 overflow-hidden"
  >
    <div
      class="sticky top-0 z-10 shrink-0 px-3 py-3 rounded-t-lg bg-default border-t-4"
      :style="{ borderTopColor: accentColor }"
    >
      <div class="flex items-center justify-between gap-2">
        <span
          class="text-xs font-bold uppercase tracking-wide text-highlighted truncate"
        >
          {{ title }}
        </span>
        <UBadge
          color="neutral"
          variant="subtle"
          size="sm"
          :label="String(count)"
        />
      </div>
    </div>

    <div
      ref="scrollContainerRef"
      class="min-h-0 flex-1 overflow-y-auto space-y-2 bg-accented/50 p-2"
    >
      <template v-if="isInitialLoading">
        <UCard
          v-for="index in 3"
          :key="`skeleton-${index}`"
          :ui="{ body: 'space-y-3 p-3' }"
        >
          <USkeleton class="h-4 w-2/3" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-3 w-4/5" />
        </UCard>
      </template>

      <div
        v-else-if="isError"
        class="flex flex-col items-center gap-3 px-2 py-8 text-center"
      >
        <UIcon
          name="i-lucide-triangle-alert"
          class="size-8 text-error"
        />
        <div class="space-y-1">
          <p class="text-sm font-medium text-highlighted">
            No se pudo cargar la columna
          </p>
          <p
            v-if="errorMessage"
            class="text-xs text-muted"
          >
            {{ errorMessage }}
          </p>
        </div>
        <UButton
          color="neutral"
          icon="i-lucide-refresh-cw"
          label="Reintentar"
          size="sm"
          variant="subtle"
          @click="emit('retry')"
        />
      </div>

      <template v-else>
        <template
          v-for="item in items"
          :key="(item as { id?: number }).id ?? item"
        >
          <slot :item="item" />
        </template>

        <p
          v-if="items.length === 0"
          class="px-2 py-6 text-center text-xs text-muted"
        >
          Sin solicitudes
        </p>

        <div
          v-if="isLoadMoreError"
          class="rounded-lg border border-error/30 bg-error/5 px-3 py-2 text-center space-y-2"
        >
          <p class="text-xs text-error">
            No se pudieron cargar más solicitudes
          </p>
          <UButton
            color="neutral"
            icon="i-lucide-refresh-cw"
            label="Reintentar"
            size="xs"
            variant="subtle"
            @click="emit('retry')"
          />
        </div>
      </template>

      <div
        v-if="isLoadingMore"
        class="flex justify-center py-2"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-5 animate-spin text-muted"
        />
      </div>
    </div>
  </div>
</template>
