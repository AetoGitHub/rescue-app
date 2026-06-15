<script setup lang="ts">
import type { CatalogDropdownFetcher } from '~/composables/useCatalogDropdown';
import type { CatalogDropdownRow } from '~/interfaces/shared/catalog-dropdown.interface';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

const open = defineModel<boolean>('open', { required: true });

defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const reacceptanceReasonId = defineModel<number | null>('reacceptanceReasonId', {
  required: true,
});

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
  emit('submit');
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    title="Revertir cancelación"
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
            v-model="reacceptanceReasonId"
            placeholder="Selecciona un motivo"
            :fetcher="fetchReacceptanceReasonDropdown"
          />
        </UFormField>

        <UButton
          color="neutral"
          label="Administrar motivos"
          size="xs"
          variant="link"
          to="/admin/catalogs/cancellation-reasons"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          label="Cerrar"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          color="primary"
          label="Revertir cancelación"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
