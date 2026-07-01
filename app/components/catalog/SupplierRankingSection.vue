<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type {
  SupplierRankingSummary,
  SupplierReviewFormState,
} from '~/interfaces/catalogs/supplier';
import { supplierReviewSchema } from '~/schemas/catalog-create';

const props = defineProps<{
  summary: SupplierRankingSummary;
  supplierId: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  submitted: [];
}>();

const { createReview, isCreating } = useSupplierReviewMutation();

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

const state = reactive<SupplierReviewFormState>({
  rating: 0,
  selectedChips: [],
  freeComment: '',
});

const displayScore = computed(() => {
  const value = props.summary.score;
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toFixed(1);
});

function resetReviewForm() {
  state.rating = 0;
  state.selectedChips = [];
  state.freeComment = '';
}

async function onSubmit(event: FormSubmitEvent<SupplierReviewFormState>) {
  try {
    await createReview(props.supplierId, event.data);
    resetReviewForm();
    emit('submitted');
  } catch {
    // Error toast handled in mutation
  }
}

function onFormError() {
  // Validation errors shown by UForm
}

async function requestSubmit() {
  await formRef.value?.submit();
}
</script>

<template>
  <section class="space-y-4">
    <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
      Ranking
    </h3>

    <div class="rounded-lg border border-default p-4 space-y-4">
      <div class="flex items-center gap-4">
        <p class="text-3xl font-semibold tabular-nums text-warning">
          {{ displayScore }}
        </p>
        <div class="space-y-1">
          <CatalogSupplierRankingDisplay
            :score="summary.score"
            size="sm"
          />
          <p class="text-xs uppercase tracking-wide text-muted">
            Total de servicios: {{ summary.rescues_count }}
          </p>
        </div>
      </div>

      <div class="border-t border-default pt-4 space-y-3">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          Calificar este proveedor
        </p>

        <UForm
          ref="formRef"
          :schema="supplierReviewSchema"
          :state="state"
          class="space-y-3"
          @submit="onSubmit"
          @error="onFormError"
        >
          <CatalogSupplierReviewRatingFields
            v-model:rating="state.rating"
            v-model:selected-chips="state.selectedChips"
            v-model:free-comment="state.freeComment"
          />

          <div class="flex justify-end">
            <UButton
              type="button"
              color="primary"
              label="Guardar calificación"
              :loading="loading || isCreating"
              :disabled="loading || isCreating"
              @click="requestSubmit"
            />
          </div>
        </UForm>
      </div>
    </div>
  </section>
</template>
