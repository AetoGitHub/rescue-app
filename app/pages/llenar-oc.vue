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

const isDev = import.meta.dev;

useHead({
  title: FILL_OC_LABELS.pageTitle,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
});
</script>

<template>
  <main class="flex min-h-svh flex-col bg-muted/30">
    <AdministrativeFillOcDevPreview v-if="isDev" />

    <AdministrativeFillOcList
      v-if="apiKey"
      class="flex min-h-0 flex-1 flex-col"
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
