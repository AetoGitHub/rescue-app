<script setup lang="ts">
import { clientCreditPath } from '~/constants/client-credit-api';
import type { CreditTemporaryUnlock } from '~/interfaces/catalogs/credit';
import { formatClientMoney } from '~/utils/client-list-display';

const route = useRoute();
const apiFetch = useApiFetch();

const clientId = computed(() => Number(route.params.clientId));

const { data: clientDetail, isPending: clientPending } = useQuery({
  key: () => ['client-detail', clientId.value],
  query: async () => {
    const raw = await apiFetch<Record<string, unknown>>(
      `/api/catalogue/client/detail/${clientId.value}/`,
    );
    return mapClientDetail(raw);
  },
});

const { data: clientCredit, isPending: creditPending } = useQuery({
  key: () => ['client-credit', clientId.value],
  query: async () => {
    try {
      const raw = await apiFetch<Record<string, unknown>>(
        clientCreditPath(clientId.value),
      );
      return mapCreditDetail(raw);
    } catch (error) {
      if (isClientCreditNotFoundError(error)) return null;
      throw error;
    }
  },
});

const companyId = computed(() => clientDetail.value?.company ?? null);
const creditId = computed(() => {
  const id = clientCredit.value?.creditId;
  return id != null && id > 0 ? id : null;
});

const creditUnlockList = useCreditUnlockList({
  companyId,
  creditId,
  activeFilter: 'all',
  enabled: computed(() => companyId.value != null && creditId.value != null),
});

const unlockRows = computed(() => creditUnlockList.rows.value);
const pagePending = computed(
  () =>
    clientPending.value
    || creditPending.value
    || creditUnlockList.isInitialLoading.value,
);

const clientTitle = computed(
  () => clientDetail.value?.name?.trim() || `Cliente #${clientId.value}`,
);

function unlockModeLabel(mode: CreditTemporaryUnlock['mode']): string {
  return mode === 'money' ? 'Monto' : 'Días';
}

function formatUnlockDate(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

useHead({
  title: computed(() => `Extensiones · ${clientTitle.value}`),
});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <SharedNavbar title="Extensiones de crédito" />
    </template>

    <template #body>
      <UContainer>
        <div class="space-y-4 pb-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <UButton
              to="/admin/catalogs/clients"
              icon="i-lucide-arrow-left"
              label="Clientes"
              color="neutral"
              variant="ghost"
            />
          </div>

          <div class="space-y-1">
            <h1 class="text-xl font-semibold tracking-tight">
              {{ clientTitle }}
            </h1>
            <p class="text-sm text-muted">
              Historial completo de extensiones de crédito (activas e inactivas).
            </p>
          </div>

          <div v-if="pagePending" class="flex justify-center py-12">
            <UIcon
              name="i-lucide-loader-circle"
              class="size-8 animate-spin text-muted"
            />
          </div>

          <UPageCard
            v-else-if="companyId == null || creditId == null"
            class="space-y-2"
          >
            <p class="font-medium">Sin datos de crédito</p>
            <p class="text-sm text-muted">
              Asigna una compañía y configura la línea de crédito del cliente para
              consultar el historial.
            </p>
          </UPageCard>

          <UPageCard v-else class="space-y-3">
            <h2 class="text-xs font-semibold uppercase tracking-wider text-primary">
              Historial
            </h2>

            <div
              v-if="unlockRows.length === 0"
              class="rounded-lg border border-dashed border-default py-10 text-center text-sm text-muted"
            >
              Sin extensiones registradas para este cliente.
            </div>

            <div v-else class="overflow-x-auto rounded-lg border border-default">
              <table class="min-w-full divide-y divide-default text-sm">
                <thead class="bg-elevated/50 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th class="px-4 py-3 text-start">Modo</th>
                    <th class="px-4 py-3 text-start">Valor</th>
                    <th class="px-4 py-3 text-start">Restante</th>
                    <th class="px-4 py-3 text-start">Estado</th>
                    <th class="px-4 py-3 text-start">Creada</th>
                    <th class="px-4 py-3 text-start">Expira</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-default">
                  <tr v-for="unlock in unlockRows" :key="unlock.id">
                    <td class="px-4 py-3 font-medium">
                      {{ unlockModeLabel(unlock.mode) }}
                    </td>
                    <td class="px-4 py-3 tabular-nums">
                      {{
                        unlock.mode === 'money'
                          ? formatClientMoney(unlock.value)
                          : `${unlock.value} días`
                      }}
                    </td>
                    <td class="px-4 py-3 tabular-nums">
                      {{
                        unlock.mode === 'money'
                          ? formatClientMoney(unlock.remaining)
                          : '—'
                      }}
                    </td>
                    <td class="px-4 py-3">
                      <UBadge
                        :color="unlock.active ? 'success' : 'neutral'"
                        variant="subtle"
                        :label="unlock.active ? 'Activa' : 'Inactiva'"
                      />
                    </td>
                    <td class="px-4 py-3 text-muted">
                      {{ formatUnlockDate(unlock.created_at) }}
                    </td>
                    <td class="px-4 py-3 text-muted">
                      {{ formatUnlockDate(unlock.expires_at) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-if="creditUnlockList.hasNextPage.value && unlockRows.length > 0"
              class="flex justify-center pt-2"
            >
              <UButton
                label="Cargar más"
                color="neutral"
                variant="outline"
                size="sm"
                @click="creditUnlockList.loadNextPage()"
              />
            </div>
          </UPageCard>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
