<script setup lang="ts">
import {
  adminListContainerClass,
  adminListDashboardPanelUi,
} from '~/constants/admin-list-layout';

defineProps<{
  navbarTitle: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <UDashboardPanel :ui="adminListDashboardPanelUi">
    <template #header>
      <SharedNavbar :title="navbarTitle" />
    </template>
    <template #body>
      <UContainer :class="adminListContainerClass">
        <div
          class="flex shrink-0 flex-row flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1 class="text-3xl font-bold tracking-tight">
              {{ title }}
            </h1>
            <p v-if="description" class="mt-1 text-sm text-muted">
              {{ description }}
            </p>
          </div>
          <div
            v-if="$slots.actions"
            class="flex flex-wrap items-center gap-2"
          >
            <slot name="actions" />
          </div>
        </div>

        <USeparator class="shrink-0" />

        <div
          v-if="$slots.filters"
          class="flex shrink-0 flex-row flex-wrap gap-2"
        >
          <slot name="filters" />
        </div>

        <div class="flex min-h-0 flex-1 flex-col">
          <slot />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
