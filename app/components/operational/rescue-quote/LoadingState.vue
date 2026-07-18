<script setup lang="ts">
withDefaults(
  defineProps<{
    message?: string;
  }>(),
  {
    message: 'Cargando cotización…',
  },
);
</script>

<template>
  <div
    class="space-y-4 py-1"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div class="flex items-center gap-2.5">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-5 shrink-0 animate-spin text-primary"
      />
      <div class="min-w-0">
        <p class="text-sm font-medium text-highlighted">
          {{ message }}
        </p>
        <p class="text-xs text-muted">
          Esto puede tardar unos segundos.
        </p>
      </div>
    </div>

    <div class="space-y-3 rounded-lg border border-default bg-elevated/20 p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <USkeleton class="h-5 w-44" />
        <USkeleton class="h-6 w-32 rounded-full" />
      </div>

      <div class="overflow-hidden rounded-lg border border-default">
        <div class="border-b border-default bg-elevated/50 px-3 py-2.5">
          <div class="flex gap-3">
            <USkeleton class="h-3 w-20" />
            <USkeleton class="h-3 w-16" />
            <USkeleton class="hidden h-3 w-24 sm:block" />
            <USkeleton class="ms-auto h-3 w-16" />
          </div>
        </div>
        <div class="divide-y divide-default">
          <div
            v-for="index in 3"
            :key="index"
            class="flex items-center gap-3 px-3 py-3"
          >
            <USkeleton class="h-9 min-w-0 flex-1" />
            <USkeleton class="h-9 w-16 shrink-0" />
            <USkeleton class="hidden h-9 w-24 shrink-0 sm:block" />
            <USkeleton class="h-5 w-20 shrink-0" />
          </div>
        </div>
      </div>

      <div class="flex justify-end border-t border-default pt-3">
        <div class="w-full max-w-xs space-y-2">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-4/5" />
          <USkeleton class="h-6 w-3/5" />
        </div>
      </div>
    </div>
  </div>
</template>
