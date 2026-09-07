<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

defineProps<{
  message: string;
  folio?: string | null;
}>();
</script>

<template>
  <UModal
    v-model:open="open"
    fullscreen
    title="Rescate bloqueado"
    :ui="{
      title: 'text-3xl sm:text-4xl font-bold',
      body: 'flex flex-1 items-center justify-center',
    }"
  >
    <template #body>
      <div class="max-w-2xl space-y-6 text-center">
        <p
          v-if="folio"
          class="text-xl font-semibold text-highlighted sm:text-2xl"
        >
          Folio: {{ folio }}
        </p>
        <p class="text-xl leading-relaxed text-muted sm:text-2xl">
          {{ message }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-center">
        <UButton
          type="button"
          color="primary"
          variant="solid"
          size="xl"
          label="Entendido"
          @click="open = false"
        />
      </div>
    </template>
  </UModal>
</template>
