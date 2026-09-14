<script setup lang="ts">
const props = defineProps<{
  rescueId: number;
  apiKey: string;
}>();

const { evidences, isPending, errorMessage, refresh } = useGuestRescueEvidence(
  () => props.rescueId,
  () => props.apiKey,
);
</script>

<template>
  <div class="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
    <header class="flex items-center gap-3 border-b border-default pb-4">
      <UIcon name="i-lucide-images" class="size-8 text-primary" />
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-muted">
          Rescate #{{ rescueId }}
        </p>
        <h1 class="text-xl font-semibold text-highlighted">
          Evidencias
        </h1>
      </div>
    </header>

    <GuestRescueDetailEvidenceGallery
      :evidences="evidences"
      :is-pending="isPending"
      :error-message="errorMessage"
      @retry="() => void refresh()"
    />
  </div>
</template>
