<script setup lang="ts">
import {
  adminListContainerClass,
  adminListDashboardPanelUi,
  adminListPageTitleClass,
} from '~/constants/admin-list-layout';
import { FILL_OC_LABELS } from '~/constants/fill-oc-api';

useHead({
  title: FILL_OC_LABELS.pageTitle,
});
</script>

<template>
  <UDashboardPanel :ui="adminListDashboardPanelUi">
    <template #header>
      <SharedNavbar :title="FILL_OC_LABELS.pageTitle" />
    </template>

    <template #body>
      <UContainer :class="adminListContainerClass">
        <div class="shrink-0 flex flex-col gap-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Módulo Administración
          </p>
          <h1 :class="adminListPageTitleClass">
            {{ FILL_OC_LABELS.pageTitle }}
          </h1>
          <p class="text-sm text-muted">
            {{ FILL_OC_LABELS.pageDescription }}
          </p>
        </div>

        <USeparator class="shrink-0" />

        <AdministrativeFillOcList class="min-h-0 flex-1" />
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
