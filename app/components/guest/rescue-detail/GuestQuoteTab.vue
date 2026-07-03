<script setup lang="ts">
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { guestQuoteDisplayUnitPrice } from '~/utils/guest-quote-display';

const props = defineProps<{
  rescueId: number;
  token: string;
  quoteDetail: RescueQuoteDetail | null;
  isPending?: boolean;
  errorMessage?: string;
}>();

const { isViewingPdf, isDownloadingPdf, viewQuotePdf, downloadQuotePdf } =
  useGuestQuotePdf(
    () => props.rescueId,
    () => props.token,
  );

const showPdfActions = computed(() => props.quoteDetail != null);

function formatMoney(value: string | number | null | undefined): string {
  return formatRescueCardMoney(value);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="isPending" class="flex items-center justify-center gap-2 py-12">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-6 animate-spin text-muted"
      />
      <span class="text-sm text-muted">Cargando cotización…</span>
    </div>

    <UAlert
      v-else-if="errorMessage"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="No se pudo cargar la cotización"
      :description="errorMessage"
    />

    <div
      v-if="showPdfActions && !isPending && !errorMessage"
      class="flex flex-wrap justify-end gap-2"
    >
      <UButton
        variant="outline"
        color="neutral"
        icon="i-lucide-file-text"
        label="Ver PDF"
        :loading="isViewingPdf"
        @click="viewQuotePdf()"
      />
      <UButton
        variant="outline"
        color="neutral"
        icon="i-lucide-download"
        label="Descargar PDF"
        :loading="isDownloadingPdf"
        @click="downloadQuotePdf()"
      />
    </div>

    <UCard
      v-if="quoteDetail && !isPending && !errorMessage"
      variant="subtle"
      :ui="{ body: 'space-y-4 text-sm' }"
    >
      <div class="space-y-2">
        <h3 class="text-sm font-semibold text-highlighted">Cotización</h3>
        <p class="text-2xl font-bold text-primary">
          {{ formatMoney(quoteDetail.total) }}
        </p>
      </div>

      <dl class="grid gap-2 sm:grid-cols-3 text-muted">
        <div>
          <dt>Subtotal</dt>
          <dd class="font-medium text-highlighted tabular-nums">
            {{ formatMoney(quoteDetail.sub_total) }}
          </dd>
        </div>
        <div>
          <dt>IVA</dt>
          <dd class="font-medium text-highlighted tabular-nums">
            {{ quoteDetail.iva }}%
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd class="font-medium text-highlighted tabular-nums">
            {{ formatMoney(quoteDetail.total) }}
          </dd>
        </div>
      </dl>

      <div class="overflow-x-auto border-t border-default pt-4">
        <h4
          class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Servicios
        </h4>
        <table class="w-full min-w-md text-sm">
          <thead>
            <tr
              class="border-b border-default text-left text-xs uppercase text-muted"
            >
              <th class="pb-2 pr-3 font-medium">Servicio</th>
              <th class="pb-2 pr-3 font-medium text-right">P. unitario</th>
              <th class="pb-2 pr-3 font-medium text-right">Cantidad</th>
              <th class="pb-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="service in quoteDetail.services" :key="service.id">
              <td class="py-2 pr-3 font-medium text-highlighted">
                {{ service.service_name }}
              </td>
              <td class="py-2 pr-3 text-right tabular-nums text-highlighted">
                {{
                  guestQuoteDisplayUnitPrice(service.total, service.quantity)
                }}
              </td>
              <td class="py-2 pr-3 text-right tabular-nums text-muted">
                {{ service.quantity }}
              </td>
              <td
                class="py-2 text-right tabular-nums font-medium text-highlighted"
              >
                {{ formatMoney(service.total) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <p
      v-else-if="!isPending && !errorMessage && !quoteDetail"
      class="py-8 text-center text-sm text-muted"
    >
      Sin cotización registrada
    </p>
  </div>
</template>
