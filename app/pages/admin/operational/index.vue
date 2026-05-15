<script setup lang="ts">
const rescueRequestModalRef = ref<{
  openCreate: () => void;
} | null>(null);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Operacional" />
    </template>

    <template #body>
      <div class="flex flex-col mb-4">
        <div class="mb-4">
          <UInput leading-icon="i-lucide-search" placeholder="Buscar folio" />
        </div>
        <div class="flex flex-row items-center justify-end gap-2">
          <UButton
            color="neutral"
            icon="i-lucide-eye"
            label="Columnas"
            variant="subtle"
          />

          <UFieldGroup>
            <UButton color="primary" icon="i-lucide-grid" variant="solid" />
            <UButton color="neutral" icon="i-lucide-list" variant="subtle" />
          </UFieldGroup>

          <UButton
            icon="i-lucide-plus"
            label="Nueva solicitud"
            @click="rescueRequestModalRef?.openCreate()"
          />
        </div>
      </div>

      <OperationalRescueRequestModal ref="rescueRequestModalRef" />

      <div class="overflow-x-auto">
        <div class="flex gap-3 min-w-max">
          <div
            v-for="item in Array.from({ length: 10 })"
            :key="`solicitud-${item}`"
            class="w-[280px] shrink-0 flex flex-col rounded-lg bg-muted/30"
          >
            <div
              class="sticky top-0 z-10 px-3 py-2.5 rounded-t-lg bg-default border-t-2 border-t-primary"
            >
              <div class="flex items-center justify-between">
                <span
                  class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted truncate"
                >
                  Solicitado
                </span>
              </div>
            </div>

            <div class="p-2 overflow-y-auto space-y-2 bg-accented max-h-screen">
              <UCard
                v-for="(_, key) in Array.from({ length: 100 })"
                :key="`solicitud-${key}`"
              >
                Hi
              </UCard>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
