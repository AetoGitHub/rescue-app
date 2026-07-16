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
const pendingUnlockedUntil = ref<string | null>(null);

function emptyState(): RescueUnlockFormState {
  return {
    unlocked_until_local: '',
    reason: '',
  };
}

const state = reactive<RescueUnlockFormState>(emptyState());
const {
  guardedOpen,
  discardConfirmOpen,
  requestClose,
  confirmDiscard,
  cancelDiscard,
  closeWithoutConfirm,
  resetDirtySnapshot,
} = useDiscardChangesGuard({
  open,
  snapshot: () => state,
});

const rescueIdRef = computed(() => props.rescueId);
const { unlockRescue, isUnlocking } = useRescueUnlockMutation(rescueIdRef);

const minUnlockDatetimeLocal = computed(() => getRescueUnlockMinDatetimeLocal());

const unlockFormSchema = computed(() => createRescueUnlockFormSchema());

const resolvedUnlockedUntil = computed(() =>
  coalesceUnlockUntil(props.unlockedUntil, pendingUnlockedUntil.value),
);

const { isActive: isCurrentlyUnlocked } = useRescueUnlockCountdown(
  () => resolvedUnlockedUntil.value,
);

const unlockedUntilLabel = computed(() => {
  if (!resolvedUnlockedUntil.value?.trim()) return '';
  const date = new Date(resolvedUnlockedUntil.value);
  if (Number.isNaN(date.getTime())) return resolvedUnlockedUntil.value;
  return date.toLocaleString('es-MX');
});

watch(
  () => props.unlockedUntil,
  (value) => {
    if (value?.trim()) pendingUnlockedUntil.value = null;
  },
);

watch(
  () => props.rescueId,
  () => {
    pendingUnlockedUntil.value = null;
    open.value = false;
  },
);

function resetForm() {
  Object.assign(state, emptyState());
}

function openUnlockModal() {
  if (isCurrentlyUnlocked.value) return;
  open.value = true;
}

watch(open, (isOpen) => {
  if (isOpen) {
    resetDirtySnapshot();
    return;
  }
  resetForm();
});

watch(isCurrentlyUnlocked, (active) => {
  if (active) open.value = false;
});

async function onSubmit(event: FormSubmitEvent<RescueUnlockFormState>) {
  if (isRescueUnlockActive(resolvedUnlockedUntil.value)) return;

  try {
    const body = toRescueUnlockApiBody(event.data);
    await unlockRescue(body);
    pendingUnlockedUntil.value = body.unlocked_until;
    closeWithoutConfirm();
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
  <UTooltip
    :disabled="!isCurrentlyUnlocked"
    :text="`Desbloqueo vigente hasta ${unlockedUntilLabel}`"
  >
    <UButton
      icon="i-lucide-lock-open"
      label="Desbloquear rescate"
      color="neutral"
      variant="outline"
      :disabled="isCurrentlyUnlocked"
      @click="openUnlockModal"
    />
  </UTooltip>

  <UModal
    v-model:open="guardedOpen"
    :dismissible="false"
    title="Desbloquear rescate"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-4">
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
          @click="requestClose"
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

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>
