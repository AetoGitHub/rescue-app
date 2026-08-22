<script setup lang="ts">
import type { FillOcStaffFetch } from '~/composables/useFillOcStaffAuth';
import type { FillOcPendingItem } from '~/interfaces/nexxt-step/fill-oc';

const props = defineProps<{
  item: FillOcPendingItem | null;
  staffAuthToken: string;
  staffUserId: number | null;
  staffFetch: FillOcStaffFetch;
  fillOcMock: boolean;
}>();

const open = defineModel<boolean>('open', { required: true });

const rescueId = computed(() => props.item?.id ?? null);
</script>

<template>
  <UModal
    v-model:open="open"
    :title="item?.folio ?? 'Chat'"
    :description="item ? `${item.responsable} · ${item.vehicle || '—'}` : undefined"
    :ui="{
      content: 'max-w-lg sm:max-w-xl',
      body: 'min-h-0 p-0 sm:p-0',
    }"
  >
    <template #body>
      <div class="flex h-[min(70vh,560px)] min-h-80 flex-col p-4">
        <OperationalRescueDetailChat
          v-if="rescueId != null"
          :rescue-id="rescueId"
          layout="sidebar"
          :staff-auth-token="staffAuthToken"
          :staff-user-id="staffUserId"
          :staff-fetch="staffFetch"
          :fill-oc-mock="fillOcMock"
        />
        <p
          v-else
          class="py-12 text-center text-sm text-muted"
        >
          No se pudo abrir el chat de este folio.
        </p>
      </div>
    </template>
  </UModal>
</template>
