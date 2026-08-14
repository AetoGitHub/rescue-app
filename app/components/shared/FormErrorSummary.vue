<script setup lang="ts">
import type { FormValidationError } from '~/utils/form-validation-feedback';

const props = defineProps<{
  errors: FormValidationError[];
}>();

const emit = defineEmits<{
  select: [error: FormValidationError];
}>();

const title = computed(() =>
  props.errors.length === 1
    ? 'Hay 1 error'
    : `Hay ${props.errors.length} errores`,
);
</script>

<template>
  <UAlert
    v-if="errors.length"
    color="error"
    variant="subtle"
    icon="i-lucide-circle-alert"
    :title="title"
  >
    <template #description>
      <ul class="mt-1 space-y-1">
        <li
          v-for="(error, index) in errors"
          :key="error.name ?? error.id ?? index"
        >
          <button
            type="button"
            class="text-left underline-offset-2 hover:underline"
            @click="emit('select', error)"
          >
            {{ error.message?.trim() || 'Revisa este campo' }}
          </button>
        </li>
      </ul>
    </template>
  </UAlert>
</template>
