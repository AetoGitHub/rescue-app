import { fileURLToPath } from 'node:url';
import { SESSION_MAX_AGE } from './shared/constants/session';

const sharedDir = fileURLToPath(new URL('./shared', import.meta.url));

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  alias: {
    '#shared': sharedDir,
  },
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
    'nuxt-authorization',
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
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],
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
    n8nCoordsToAddressUrl: '',
    n8nLinkToCoordsUrl: '',
    n8nRescueClassifierUrl: '',
    quotePdfApiUrl: '',
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
