<script setup lang="ts">
const route = useRoute();

const rescueId = computed(() => parseGuestRescueIdParam(route.params.id));
const apiKey = computed(() => parseGuestAuthorizationTokenParam(route.query['api-key']));

definePageMeta({
  layout: false,
});

useHead({
  title: 'Cotización',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>

<template>
  <div class="min-h-svh bg-muted/30">
    <GuestRescueDetailReportView
      v-if="rescueId != null && apiKey"
      :rescue-id="rescueId"
      :api-key="apiKey"
    />
    <div
      v-else
      class="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-10 text-error" />
      <p class="text-sm text-muted">
        Enlace no válido o expirado
      </p>
    </div>
  </div>
</template>
