<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import {
  createRescueUnlockFormSchema,
  type RescueUnlockFormState,
} from '~/utils/rescue-unlock-form';

const props = defineProps<{
  rescueId: number;
  unlockedUntil?: string | null;
}>();

const emit = defineEmits<{
  success: [];
}>();

const open = ref(false);
const formRef = ref<{ submit: () => Promise<void> } | null>(null);

function emptyState(): RescueUnlockFormState {
  return {
    unlocked_until_local: '',
    reason: '',
  };
}

const state = reactive<RescueUnlockFormState>(emptyState());

const rescueIdRef = computed(() => props.rescueId);
const { unlockRescue, isUnlocking } = useRescueUnlockMutation(rescueIdRef);

const minUnlockDatetimeLocal = computed(() => getRescueUnlockMinDatetimeLocal());

const unlockFormSchema = computed(() => createRescueUnlockFormSchema());

const isCurrentlyUnlocked = computed(() =>
  isRescueUnlockActive(props.unlockedUntil),
);

const unlockedUntilLabel = computed(() => {
  if (!props.unlockedUntil?.trim()) return '';
  const date = new Date(props.unlockedUntil);
  if (Number.isNaN(date.getTime())) return props.unlockedUntil;
  return date.toLocaleString('es-MX');
});

function resetForm() {
  Object.assign(state, emptyState());
}

watch(open, (isOpen) => {
  if (!isOpen) resetForm();
});

async function onSubmit(event: FormSubmitEvent<RescueUnlockFormState>) {
  try {
    await unlockRescue(toRescueUnlockApiBody(event.data));
    open.value = false;
    emit('success');
  } catch {
    // Toast handled in mutation
  }
}

async function requestSubmit() {
  await formRef.value?.submit();
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Desbloquear rescate"
    :ui="{ content: 'max-w-md' }"
  >
    <UButton
      icon="i-lucide-lock-open"
      label="Desbloquear rescate"
      color="neutral"
      variant="outline"
      @click="open = true"
    />

    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="isCurrentlyUnlocked"
          color="info"
          icon="i-lucide-lock-open"
          title="Rescate desbloqueado"
          :description="`Vigente hasta ${unlockedUntilLabel}`"
          variant="subtle"
        />

        <UForm
          ref="formRef"
          :state="state"
          :schema="unlockFormSchema"
          class="space-y-3"
          @submit="onSubmit"
        >
          <UFormField
            label="Desbloquear hasta"
            name="unlocked_until_local"
            required
          >
            <UInput
              v-model="state.unlocked_until_local"
              type="datetime-local"
              :min="minUnlockDatetimeLocal"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Razón"
            name="reason"
            required
          >
            <UInput
              v-model="state.reason"
              class="w-full"
            />
          </UFormField>
        </UForm>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          label="Cancelar"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          type="button"
          label="Confirmar desbloqueo"
          :loading="isUnlocking"
          @click="requestSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
