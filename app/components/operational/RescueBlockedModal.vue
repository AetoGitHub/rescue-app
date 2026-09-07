<script setup lang="ts">
import { RESCUE_BLOCKED_CONTACT_NAME } from '~/constants/rescue-blocked';

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
      title: 'text-4xl sm:text-5xl font-bold',
      body: 'flex flex-1 items-center justify-center',
    }"
  >
    <template #body>
      <div class="max-w-4xl space-y-8 text-center">
        <p
          v-if="folio"
          class="text-2xl font-semibold text-highlighted sm:text-3xl"
        >
          Folio: {{ folio }}
        </p>
        <p class="text-2xl leading-relaxed text-muted sm:text-3xl">
          {{ message }}
        </p>
        <p class="text-2xl leading-relaxed text-muted sm:text-3xl">
          Contacta a
          <span class="font-bold italic underline">{{ RESCUE_BLOCKED_CONTACT_NAME }}</span>.
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
