<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import {
  emptyCatalogDropdownSelection,
  type CatalogDropdownRow,
  type CatalogDropdownSelection,
} from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

const open = defineModel<boolean>('open', { required: true });

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const cancellationReason = defineModel<CatalogDropdownSelection>(
  'cancellationReason',
  {
    required: true,
    default: () => emptyCatalogDropdownSelection(),
  },
);

const apiFetch = useApiFetch();

const fetchCancellationReasonDropdown: CatalogDropdownFetcher = (
  name,
  options,
) =>
  apiFetch<PaginatedResponse<CatalogDropdownRow>>(
    '/api/catalogue/multipurpose/dropdown/',
    {
      query: { type: 'cancellation_reason', name },
      signal: options?.signal,
    },
  );
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    title="Cancelar"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-3">
        <UFormField
          label="Motivo"
          name="cancellation_reason"
          required
        >
          <CatalogDropdownSelect
            v-model="cancellationReason"
            placeholder="Selecciona un motivo"
            :fetcher="fetchCancellationReasonDropdown"
          />
        </UFormField>

        <UButton
          block
          color="error"
          label="Confirmar cancelación"
          :loading="loading"
          @click="emit('submit')"
        />
      </div>
    </template>
  </UModal>
</template>
