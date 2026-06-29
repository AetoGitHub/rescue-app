<script setup lang="ts">
import {
  adminListContainerClass,
  adminListDashboardPanelUi,
  adminListFiltersClass,
  adminListPageTitleClass,
  adminListTableWrapperClass,
  adminListToolbarClass,
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
        <div :class="adminListToolbarClass">
          <div class="min-w-0">
            <h1 :class="adminListPageTitleClass">
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
          :class="adminListFiltersClass"
        >
          <slot name="filters" />
        </div>

        <div class="flex min-h-0 flex-1 flex-col">
          <div :class="adminListTableWrapperClass">
            <slot />
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
