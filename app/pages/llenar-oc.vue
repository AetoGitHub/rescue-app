<script setup lang="ts">
import { FILL_OC_LABELS } from '~/constants/fill-oc-api';

/**
 * Enlace público que reparte n8n: la URL se conserva, pero la página vive
 * fuera de `admin.vue` para no arrastrar los middlewares de sesión.
 */
definePageMeta({
  path: '/admin/llenar-oc',
  layout: false,
});

const route = useRoute();

const apiKey = computed(() => {
  const raw = route.query.key;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' ? value.trim() : '';
});

useHead({
  title: FILL_OC_LABELS.pageTitle,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>

<template>
  <main class="min-h-svh bg-muted/30">
    <AdministrativeFillOcList
      v-if="apiKey"
      :api-key="apiKey"
    />

    <div
      v-else
      class="mx-auto w-full max-w-xl px-4 py-16"
    >
      <AdministrativeFillOcStateMessage
        icon="i-lucide-key-round"
        tone="warning"
        :title="FILL_OC_LABELS.missingKeyTitle"
        :description="FILL_OC_LABELS.missingKeyDescription"
      />
    </div>
  </main>
</template>
