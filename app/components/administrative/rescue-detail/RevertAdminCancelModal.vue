<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import {
  emptyCatalogDropdownSelection,
  type CatalogDropdownRow,
  type CatalogDropdownSelection,
} from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const reacceptanceReason = defineModel<CatalogDropdownSelection>(
  'reacceptanceReason',
  {
    required: true,
    default: () => emptyCatalogDropdownSelection(),
  },
);

const apiFetch = useApiFetch();

const fetchReacceptanceReasonDropdown: CatalogDropdownFetcher = (
  name,
  options,
) =>
  apiFetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/multipurpose/dropdown/',
    {
      query: { type: 'reacceptance_reason', name },
      signal: options?.signal,
    },
  );

function onSubmit() {
  if (props.loading || reacceptanceReason.value.value == null) return;
  emit('submit');
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    title="Revertir cancelación administrativa"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-3">
        <UFormField
          label="Motivo de re-aceptación"
          name="reacceptance_reason"
          required
        >
          <CatalogDropdownSelect
            v-model="reacceptanceReason"
            :fetcher="fetchReacceptanceReasonDropdown"
            placeholder="Selecciona motivo"
            :disabled="loading"
          />
        </UFormField>

        <UButton
          block
          color="primary"
          label="Revertir cancelación"
          :disabled="loading || reacceptanceReason.value == null"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
