import { SESSION_MAX_AGE } from './shared/constants/session';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true,
    },
  },

  modules: [
    // '@nuxt/hints',
    // '@nuxt/a11y',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/eslint',
    '@pinia/nuxt',
    'nuxt-auth-utils',
    '@pinia/colada-nuxt',
    '@nuxt/test-utils/module',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Rescates',
      htmlAttrs: {
        lang: 'es-MX',
      },
    },
  },

  ui: {
    colorMode: true,
  },

  fonts: {
    families: [
      {
        name: 'Barlow',
        provider: 'google',
      },
    ],
  },

  runtimeConfig: {
    apiUrl: '',
    session: {
      maxAge: SESSION_MAX_AGE,
    },
    public: {
      googleMapsApiKey: '',
      firebaseUploadWebhookUrl: '',
    },
  },

  vite: {
    optimizeDeps: {
      include: ['zod', 'vue3-google-map', '@vueuse/core'],
    },
  },

  typescript: {
    tsConfig: {
      include: ['../test/unit/**/*'],
    },
  },
});
