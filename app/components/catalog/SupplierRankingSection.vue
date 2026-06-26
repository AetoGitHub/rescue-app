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
  comment: '',
});

const displayScore = computed(() => {
  const value = props.summary.score;
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toFixed(1);
});

function setRating(rating: number) {
  state.rating = rating;
}

function resetReviewForm() {
  state.rating = 0;
  state.comment = '';
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
          <UFormField name="rating" required>
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="rounded p-0.5 transition-colors hover:bg-elevated"
                :aria-label="`${star} estrellas`"
                @click="setRating(star)"
              >
                <UIcon
                  :name="state.rating >= star ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
                  class="size-5"
                  :class="state.rating >= star ? 'text-warning' : 'text-muted opacity-60'"
                />
              </button>
            </div>
          </UFormField>

          <UFormField label="Comentario (opcional)" name="comment">
            <UTextarea
              v-model="state.comment"
              class="w-full"
              :rows="2"
              placeholder="Describe tu experiencia con este proveedor"
            />
          </UFormField>

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
