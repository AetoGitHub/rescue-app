<script setup lang="ts">
import { adminListPageTitleClass } from '~/constants/admin-list-layout';

/**
 * Encabezado de los reportes del portal: título a la izquierda y los KPIs
 * (slot `stats`) en la misma fila desde `xl`; abajo del título en pantallas
 * más chicas.
 */
defineProps<{
  title: string;
}>();
</script>

<template>
  <header class="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-8">
    <div class="flex min-w-0 flex-col gap-1 xl:shrink-0">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-primary">
        Módulo Cobranza
      </p>
      <h1 :class="adminListPageTitleClass">
        {{ title }}
      </h1>
      <div class="flex flex-col gap-0.5 text-sm text-muted sm:flex-row sm:items-center sm:gap-1.5">
        <slot name="meta" />
      </div>
    </div>

    <div
      v-if="$slots.stats"
      class="min-w-0 xl:flex-1"
    >
      <slot name="stats" />
    </div>
  </header>
</template>
