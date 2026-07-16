<script setup lang="ts">
import { RESCUE_PAYMENT_METHOD_OPTIONS, RESCUE_SERVICE_COMPLETED_PANEL_TITLE } from '~/constants/rescue-operative-flow';
import type { RescueServiceCompletedFormState } from '~/interfaces/rescue/operative';

const open = defineModel<boolean>('open', { required: true });

defineProps<{
  isLoan: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const form = defineModel<RescueServiceCompletedFormState>('form', { required: true });
const {
  guardedOpen,
  discardConfirmOpen,
  requestClose,
  confirmDiscard,
  cancelDiscard,
  resetDirtySnapshot,
} = useDiscardChangesGuard({
  open,
  snapshot: () => form.value,
});

watch(open, (isOpen) => {
  if (isOpen) resetDirtySnapshot();
});

function onSubmit() {
  emit('submit');
}
</script>

<template>
  <USlideover
    v-model:open="guardedOpen"
    :title="RESCUE_SERVICE_COMPLETED_PANEL_TITLE"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <template v-if="isLoan">
          <UFormField
            label="Fecha de desembolso"
            name="disbursement_date"
            required
          >
            <UInput
              v-model="form.disbursement_date"
              type="date"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Forma de pago del desembolso"
            name="disbursement_payment_method"
            required
          >
            <USelect
              v-model="form.disbursement_payment_method"
              :items="[...RESCUE_PAYMENT_METHOD_OPTIONS]"
              value-key="value"
              label-key="label"
              placeholder="Seleccionar"
              class="w-full"
            />
          </UFormField>
        </template>

        <section
          v-if="form.ratings.length > 0"
          class="space-y-4"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
            Calificación de proveedores
          </h3>
          <div
            v-for="row in form.ratings"
            :key="row.supplier_id"
            class="space-y-2 rounded-lg border border-default p-3"
          >
            <p class="text-sm font-medium text-highlighted">
              {{ row.supplier_name }}
            </p>
            <CatalogSupplierReviewRatingFields
              v-model:rating="row.score"
              v-model:selected-chips="row.selectedChips"
              v-model:free-comment="row.freeComment"
              :rating-name="`rating_score_${row.supplier_id}`"
              :chips-name="`rating_chips_${row.supplier_id}`"
              :free-comment-name="`rating_comment_${row.supplier_id}`"
            />
          </div>
        </section>

        <p
          v-else
          class="text-sm text-muted"
        >
          No hay proveedores asignados para calificar.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          label="Cancelar"
          variant="subtle"
          @click="requestClose"
        />
        <UButton
          color="primary"
          label="Guardar y cerrar"
          :loading="loading"
          @click="onSubmit"
        />
      </div>
    </template>
  </USlideover>

  <SharedDiscardChangesConfirmModal
    v-model:open="discardConfirmOpen"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>
