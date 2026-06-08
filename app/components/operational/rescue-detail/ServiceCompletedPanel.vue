<script setup lang="ts">
import { RESCUE_PAYMENT_METHOD_OPTIONS, RESCUE_SERVICE_COMPLETED_PANEL_TITLE } from '~/constants/rescue-operative-flow';
import type { RescueServiceCompletedFormState } from '~/interfaces/rescue/operative';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  isLoan: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
}>();

const form = defineModel<RescueServiceCompletedFormState>('form', { required: true });

function setRating(index: number, score: number) {
  const row = form.value.ratings[index];
  if (row) row.score = score;
}

function onSubmit() {
  emit('submit');
}
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="RESCUE_SERVICE_COMPLETED_PANEL_TITLE"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField
          label="Fecha de cierre"
          name="close_date"
          required
        >
          <UInput
            v-model="form.close_date"
            type="date"
            class="w-full"
          />
        </UFormField>

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
            v-for="(row, index) in form.ratings"
            :key="row.supplier_id"
            class="space-y-2 rounded-lg border border-default p-3"
          >
            <p class="text-sm font-medium text-highlighted">
              {{ row.supplier_name }}
            </p>
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="rounded p-0.5 transition-colors hover:bg-elevated"
                :aria-label="`${star} estrellas`"
                @click="setRating(index, star)"
              >
                <UIcon
                  :name="row.score >= star ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                  class="size-5"
                  :class="row.score >= star ? 'text-warning' : 'text-muted opacity-60'"
                />
              </button>
            </div>
            <UFormField
              :name="`rating_comment_${row.supplier_id}`"
              label="Comentario (opcional)"
            >
              <UTextarea
                v-model="row.comment"
                class="w-full"
                :rows="2"
              />
            </UFormField>
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
          @click="open = false"
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
</template>
