<script setup lang="ts">
withDefaults(
  defineProps<{
    active?: boolean;
    label?: string;
  }>(),
  {
    active: false,
    label: 'Suelta el archivo para subirlo',
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="active"
      class="pointer-events-none fixed inset-0 z-100 flex items-center justify-center bg-default/70 p-6 backdrop-blur-[2px]"
      aria-hidden="true"
    >
      <div
        class="flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-elevated/95 px-8 py-10 text-center shadow-lg"
      >
        <UIcon
          name="i-lucide-upload"
          class="size-10 text-primary"
        />
        <p class="text-base font-medium text-highlighted">
          {{ label }}
        </p>
      </div>
    </div>
  </Teleport>
</template>
