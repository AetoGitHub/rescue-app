<script setup lang="ts">
import type { Form, FormSubmitEvent } from '@nuxt/ui';
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
import { responsableBadgeColor } from '~/utils/pending-invoice-display';

const props = defineProps<{
  item: FillOcPendingItem;
  apiKey: string;
  downloadingEvidence?: boolean;
}>();

const emit = defineEmits<{
  saved: [id: number];
  comment: [item: FillOcPendingItem];
  evidence: [item: FillOcPendingItem];
}>();

const { submitOc } = useFillOcMutation(() => props.apiKey);

const formRef = useTemplateRef<Form<FillOcFormState>>('formRef');
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

function requestSubmit() {
  if (isLocked.value) return;
  void formRef.value?.submit();
}

onBeforeUnmount(() => {
  if (savedTimeout) clearTimeout(savedTimeout);
});
</script>

<template>
  <tr
    class="group border-t border-default transition-colors duration-150"
    :class="status === 'saved' ? 'bg-success/10' : 'hover:bg-elevated/60'"
  >
    <td class="w-9 px-2.5 py-1.5">
      <button
        type="button"
        class="relative flex text-muted hover:text-primary"
        :title="FILL_OC_LABELS.commentsTitle"
        :aria-label="FILL_OC_LABELS.commentsTitle"
        @click="emit('comment', item)"
      >
        <UIcon
          name="i-lucide-message-square"
          class="size-4"
        />
      </button>
    </td>
    <td class="w-32 px-2.5 py-1.5 font-mono font-medium whitespace-nowrap text-highlighted">
      {{ item.folio }}
    </td>
    <td class="max-w-36 px-2.5 py-1.5">
      <UBadge
        :color="responsableBadgeColor(item.responsable || '—')"
        variant="subtle"
        size="sm"
        class="max-w-full truncate"
        :label="item.responsable || '—'"
      />
    </td>
    <td
      class="max-w-28 truncate px-2.5 py-1.5"
      :title="item.vehicle"
    >
      {{ item.vehicle || '—' }}
    </td>
    <td class="w-40 px-2.5 py-1.5 whitespace-nowrap tabular-nums text-muted">
      {{ formatFillOcDateTime(item.unattended_at) }}
    </td>
    <td class="max-w-72 px-2.5 py-1.5">
      <span class="block whitespace-normal text-pretty text-muted">
        {{ item.service_description || '—' }}
      </span>
    </td>
    <td class="w-32 px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap">
      {{ formatFillOcMoney(item.sub_total) }}
    </td>
    <td class="w-28 px-2.5 py-1.5 text-right tabular-nums whitespace-nowrap">
      {{ formatFillOcMoney(item.iva) }}
    </td>
    <td class="w-32 px-2.5 py-1.5 text-right font-semibold tabular-nums whitespace-nowrap text-highlighted">
      {{ formatFillOcMoney(item.total) }}
    </td>
    <td class="w-28 px-2.5 py-1.5 text-center">
      <button
        type="button"
        class="inline-flex text-primary hover:text-primary/80 disabled:cursor-wait disabled:opacity-60"
        :title="FILL_OC_LABELS.evidenceLabel"
        :aria-label="FILL_OC_LABELS.evidenceLabel"
        :disabled="downloadingEvidence"
        @click="emit('evidence', item)"
      >
        <UIcon
          :name="downloadingEvidence ? 'i-lucide-loader-circle' : 'i-lucide-archive'"
          class="size-4"
          :class="downloadingEvidence ? 'animate-spin' : undefined"
        />
      </button>
    </td>
    <td
      class="sticky right-36 z-10 min-w-64 border-s border-default px-2 py-1 shadow-[-8px_0_8px_-6px_rgba(0,0,0,0.12)] transition-colors duration-150"
      :class="status === 'saved' ? 'bg-success/10' : 'bg-default group-hover:bg-elevated'"
    >
      <UForm
        ref="formRef"
        :schema="fillOcFormSchema"
        :state="state"
        @submit="onSubmit"
      >
        <UFormField
          name="oc"
          :ui="{ error: 'mt-1 text-xs' }"
        >
          <UInput
            v-model="state.oc"
            class="w-full"
            size="sm"
            :placeholder="FILL_OC_LABELS.inputPlaceholder"
            :disabled="isLocked"
            autocapitalize="characters"
            autocomplete="off"
            spellcheck="false"
            enterkeyhint="done"
            :aria-label="FILL_OC_LABELS.inputLabel"
          />
        </UFormField>
      </UForm>
    </td>
    <td
      class="sticky right-0 z-10 w-36 border-s border-default px-2 py-1.5 text-center transition-colors duration-150"
      :class="status === 'saved' ? 'bg-success/10' : 'bg-default group-hover:bg-elevated'"
    >
      <UButton
        :color="status === 'saved' ? 'success' : 'primary'"
        size="sm"
        class="min-w-28 justify-center"
        :variant="status === 'saved' ? 'subtle' : 'solid'"
        :label="status === 'saved' ? FILL_OC_LABELS.savedBadge : FILL_OC_LABELS.saveButton"
        :icon="status === 'saved' ? 'i-lucide-check-check' : 'i-lucide-check'"
        :loading="status === 'saving'"
        :disabled="isLocked"
        @click="requestSubmit"
      />
      <span
        v-if="status === 'saved'"
        class="sr-only"
        aria-live="polite"
      >
        {{ FILL_OC_LABELS.successToast }}
      </span>
    </td>
  </tr>
</template>
