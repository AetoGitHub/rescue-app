<script setup lang="ts">
const props = defineProps<{
  rescueId: number;
  apiKey: string;
}>();

const pdfUrl = computed(
  () => `/api/quotes/report/${props.rescueId}/${encodeURIComponent(props.apiKey)}`,
);

const isLoaded = ref(false);
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <header class="flex items-center gap-3 border-b border-default bg-default px-4 py-3 sm:px-6">
      <UIcon name="i-lucide-file-text" class="size-6 text-primary" />
      <h1 class="text-base font-semibold text-highlighted">
        Cotización
      </h1>
    </header>

    <div class="relative flex-1">
      <div
        v-if="!isLoaded"
        class="absolute inset-0 flex items-center justify-center"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <iframe
        v-show="isLoaded"
        :src="pdfUrl"
        class="h-full min-h-[80svh] w-full border-0"
        title="Cotización PDF"
        @load="isLoaded = true"
      />
    </div>
  </div>
</template>
