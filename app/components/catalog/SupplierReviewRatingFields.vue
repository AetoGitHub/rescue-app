<script setup lang="ts">
import {
  getSupplierReviewChipsForRating,
  getSupplierReviewRatingLabel,
} from '~/constants/supplier-review-chips';

const rating = defineModel<number>('rating', { required: true });
const selectedChips = defineModel<string[]>('selectedChips', { required: true });
const freeComment = defineModel<string>('freeComment', { required: true });

withDefaults(
  defineProps<{
    ratingName?: string;
    chipsName?: string;
    freeCommentName?: string;
  }>(),
  {
    ratingName: 'rating',
    chipsName: 'selectedChips',
    freeCommentName: 'freeComment',
  },
);

const chipOptions = computed(() => getSupplierReviewChipsForRating(rating.value));
const ratingLabel = computed(() => getSupplierReviewRatingLabel(rating.value));

watch(rating, (next, prev) => {
  if (next === prev) return;
  selectedChips.value = [];
  freeComment.value = '';
});

function setRating(value: number) {
  rating.value = value;
}

function toggleChip(chip: string) {
  const current = [...selectedChips.value];
  const index = current.indexOf(chip);
  if (index >= 0) {
    current.splice(index, 1);
  } else {
    current.push(chip);
  }
  selectedChips.value = current;
}

function isChipSelected(chip: string) {
  return selectedChips.value.includes(chip);
}
</script>

<template>
  <div class="space-y-3">
    <UFormField :name="ratingName" required>
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
            :name="rating >= star ? 'i-heroicons-star-solid' : 'i-heroicons-star'"
            class="size-5"
            :class="rating >= star ? 'text-warning' : 'text-muted opacity-60'"
          />
        </button>
      </div>
    </UFormField>

    <template v-if="rating >= 1">
      <UFormField :name="chipsName">
        <div class="space-y-2">
          <p
            v-if="ratingLabel"
            class="text-xs font-medium text-muted"
          >
            {{ rating }} {{ rating === 1 ? 'estrella' : 'estrellas' }} — {{ ratingLabel }}
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="chip in chipOptions"
              :key="chip"
              type="button"
              size="sm"
              :color="isChipSelected(chip) ? 'primary' : 'neutral'"
              :variant="isChipSelected(chip) ? 'solid' : 'subtle'"
              :label="chip"
              @click="toggleChip(chip)"
            />
          </div>
        </div>
      </UFormField>

      <UFormField
        :name="freeCommentName"
        label="Comentario"
      >
        <UTextarea
          v-model="freeComment"
          class="w-full"
          :rows="2"
          placeholder="Agrega detalles adicionales"
        />
      </UFormField>

      <p class="text-xs text-muted">
        Elige una o más opciones, escribe un comentario, o ambos.
      </p>
    </template>
  </div>
</template>
