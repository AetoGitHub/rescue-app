<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { FILL_OC_LABELS } from '~/constants/fill-oc-api';
import type { FillOcPendingItem } from '~/interfaces/nexxt-step/fill-oc';
import {
  fillOcFormSchema,
  fillOcFormToSubmitBody,
  type FillOcFormState,
} from '~/schemas/fill-oc';

const {
  items,
  isInitialLoading,
  isError,
  errorMessage,
  refresh,
} = useFillOcList();

const { submitOc } = useFillOcMutation();

const formStates = reactive<Record<number, FillOcFormState>>({});
const savingId = ref<number | null>(null);

watch(
  items,
  (list) => {
    for (const item of list) {
      if (!(item.id in formStates)) {
        formStates[item.id] = { oc: '' };
      }
    }
  },
  { immediate: true },
);

function createSubmitHandler(item: FillOcPendingItem) {
  return async (event: FormSubmitEvent<FillOcFormState>) => {
    await onSubmit(item, event);
  };
}

async function onSubmit(
  item: FillOcPendingItem,
  event: FormSubmitEvent<FillOcFormState>,
) {
  savingId.value = item.id;
  try {
    await submitOc(fillOcFormToSubmitBody(item.id, event.data));
    delete formStates[item.id];
  } catch {
    // Toast handled in mutation
  } finally {
    savingId.value = null;
  }
}
</script>

<template>
  <section class="flex min-h-0 flex-1 flex-col space-y-4 rounded-lg border border-default bg-default p-4">
    <div
      v-if="isInitialLoading"
      class="flex flex-1 justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="isError"
      class="flex flex-1 flex-col items-center justify-center gap-3 py-12"
    >
      <p class="text-sm text-muted">
        {{ errorMessage || 'No se pudo cargar la lista.' }}
      </p>
      <UButton
        color="neutral"
        variant="soft"
        label="Reintentar"
        icon="i-lucide-refresh-cw"
        @click="() => void refresh()"
      />
    </div>

    <div
      v-else-if="items.length === 0"
      class="flex-1 py-8 text-center text-sm text-muted"
    >
      {{ FILL_OC_LABELS.empty }}
    </div>

    <div
      v-else
      class="min-h-0 flex-1 space-y-3 overflow-y-auto"
    >
      <article
        v-for="item in items"
        :key="item.id"
        class="rounded-lg border border-default p-4"
      >
        <UForm
          v-if="formStates[item.id]"
          :schema="fillOcFormSchema"
          :state="formStates[item.id]"
          class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
          @submit="createSubmitHandler(item)"
        >
          <div class="min-w-0 space-y-1 lg:flex-1">
            <h3 class="font-semibold text-highlighted">
              {{ item.folio }}
            </h3>
          </div>

          <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:max-w-xl">
            <UFormField
              :label="FILL_OC_LABELS.inputLabel"
              name="oc"
              required
              class="min-w-0 flex-1"
            >
              <UInput
                v-model="formStates[item.id]!.oc"
                class="w-full"
                :placeholder="FILL_OC_LABELS.inputPlaceholder"
                :disabled="savingId === item.id"
              />
            </UFormField>

            <UButton
              type="submit"
              color="primary"
              :label="FILL_OC_LABELS.saveButton"
              icon="i-lucide-save"
              class="shrink-0"
              :loading="savingId === item.id"
              :disabled="savingId === item.id"
            />
          </div>
        </UForm>
      </article>
    </div>
  </section>
</template>
