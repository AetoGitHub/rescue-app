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

const cancellationReasonId = defineModel<number | null>('cancellationReasonId', {
  required: true,
});

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

function onSubmit() {
  emit('submit');
}
</script>

<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    title="Cancelar servicio"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-3">
        <UFormField
          label="Motivo de cancelación"
          name="cancellation_reason"
          required
        >
          <CatalogDropdownSelect
            v-model="cancellationReasonId"
            placeholder="Selecciona un motivo"
            :fetcher="fetchCancellationReasonDropdown"
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
          @click="() => { open = false }"
        />
        <UButton
          color="error"
          label="Cancelar servicio"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
