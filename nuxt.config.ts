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
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/a11y',
    '@pinia/nuxt',
    'nuxt-auth-utils',
    '@pinia/colada-nuxt',
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
  },
});