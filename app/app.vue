<script setup lang="ts">
import { es } from '@nuxt/ui/locale'

const locale = extendLocale(es,{
  code: 'es-MX',
});

</script>

<template>
  <UApp :locale="locale" :toaster="{ position: 'bottom-left' }">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
