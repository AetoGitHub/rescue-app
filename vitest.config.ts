import { fileURLToPath } from 'node:url';
import { defineConfig, defineProject } from 'vitest/config';
import { defineVitestProject } from '@nuxt/test-utils/config';

const appDir = fileURLToPath(new URL('./app', import.meta.url));
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const sharedDir = fileURLToPath(new URL('./shared', import.meta.url));

export default defineConfig({
  test: {
    projects: [
      defineProject({
        resolve: {
          alias: {
            '~': appDir,
            '~~': rootDir,
            '#shared': sharedDir,
          },
        },
        test: {
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      }),
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
});
