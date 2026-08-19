<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import {
  FILL_OC_LABELS,
  FILL_OC_SAVED_HOLD_MS,
} from '~/constants/fill-oc-api';
import type { FillOcPendingItem } from '~/interfaces/nexxt-step/fill-oc';
import {
  fillOcFormSchema,
  fillOcFormToSubmitBody,
  type FillOcFormState,
} from '~/schemas/fill-oc';

const props = defineProps<{
  item: FillOcPendingItem;
  apiKey: string;
}>();

const emit = defineEmits<{
  saved: [id: number];
}>();

const { submitOc } = useFillOcMutation(() => props.apiKey);

const state = reactive<FillOcFormState>({ oc: '' });
const status = ref<'idle' | 'saving' | 'saved'>('idle');
const isLocked = computed(() => status.value !== 'idle');

let savedTimeout: ReturnType<typeof setTimeout> | undefined;

async function onSubmit(event: FormSubmitEvent<FillOcFormState>) {
  if (isLocked.value) return;
  status.value = 'saving';

  try {
    await submitOc(fillOcFormToSubmitBody(props.item.id, event.data));
    status.value = 'saved';
    savedTimeout = setTimeout(() => emit('saved', props.item.id), FILL_OC_SAVED_HOLD_MS);
  } catch {
    status.value = 'idle';
  }
}

onBeforeUnmount(() => {
  if (savedTimeout) clearTimeout(savedTimeout);
});
</script>

<template>
  <article
    class="relative overflow-hidden rounded-xl border bg-default p-4 transition-colors duration-200"
    :class="status === 'saved' ? 'border-success/40' : 'border-default'"
  >
    <UForm
      :schema="fillOcFormSchema"
      :state="state"
      class="space-y-4"
      @submit="onSubmit"
    >
      <div class="min-w-0 space-y-1">
        <p class="truncate font-mono text-sm font-medium text-highlighted">
          {{ item.folio }}
        </p>
        <p class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon
            name="i-lucide-clock"
            class="size-3.5 shrink-0"
          />
          {{ formatFillOcDateTime(item.unattended_at) }}
        </p>
      </div>

      <div>
        <p class="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Total
        </p>
        <p class="text-2xl font-semibold tabular-nums text-highlighted">
          {{ formatFillOcMoney(item.total) }}
        </p>
      </div>

      <UFormField
        :label="FILL_OC_LABELS.inputLabel"
        name="oc"
        required
      >
        <UInput
          v-model="state.oc"
          class="w-full"
          size="lg"
          :placeholder="FILL_OC_LABELS.inputPlaceholder"
          :disabled="isLocked"
          autocapitalize="characters"
          autocomplete="off"
          spellcheck="false"
          enterkeyhint="done"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        size="lg"
        block
        :label="FILL_OC_LABELS.saveButton"
        icon="i-lucide-check"
        :loading="status === 'saving'"
        :disabled="isLocked"
      />
    </UForm>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-out"
      leave-to-class="opacity-0"
    >
      <div
        v-if="status === 'saved'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-default/95 backdrop-blur-[2px]"
      >
        <Transition
          appear
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 motion-safe:scale-75"
        >
          <div class="flex size-12 items-center justify-center rounded-full bg-success/10">
            <UIcon
              name="i-lucide-check"
              class="size-6 text-success"
            />
          </div>
        </Transition>
        <p class="text-sm font-medium text-success">
          {{ FILL_OC_LABELS.savedBadge }}
        </p>
      </div>
    </Transition>
  </article>
</template>
