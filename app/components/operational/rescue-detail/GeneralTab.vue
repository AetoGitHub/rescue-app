<script setup lang="ts">
import type { RescueChatMessage } from '~/interfaces/rescue';
import type { RescueCardDetail } from '~/interfaces/rescue';

const props = withDefaults(
  defineProps<{
    detail: RescueCardDetail;
    hideClientAuthorization?: boolean;
    hideChat?: boolean;
    hideEconomicSensitive?: boolean;
    hideSupplierSection?: boolean;
    editable?: boolean;
    supplierHighlight?: boolean;
    guestAuthorId?: number | null;
    guestToken?: string;
    externalChatMessages?: RescueChatMessage[] | null;
    sendChatMessage?: (text: string) => Promise<void>;
    isSendingChat?: boolean;
  }>(),
  {
    hideClientAuthorization: false,
    hideChat: false,
    hideEconomicSensitive: false,
    hideSupplierSection: false,
    editable: true,
    supplierHighlight: false,
    guestAuthorId: undefined,
    guestToken: undefined,
    externalChatMessages: undefined,
    sendChatMessage: undefined,
    isSendingChat: false,
  },
);

const emit = defineEmits<{
  'assign-supplier': [];
  'edit-service': [];
  'edit-location': [];
}>();

const serviceTypeBadge = computed(() =>
  getRescueServiceTypeBadge(props.detail.service_type),
);

const saleAmount = computed(() => {
  const sale = props.detail.sale_price;
  const sub = props.detail.sub_total;
  if (sale != null && parseRescueCardMoney(sale) > 0) {
    return formatRescueCardMoney(sale);
  }
  return formatRescueCardMoney(sub);
});

const fromQuote = computed(() =>
  showSalePriceFromQuote(props.detail.sale_price, props.detail.sub_total),
);

const hasSupplier = computed(() =>
  hasRescueSupplierAssigned(props.detail),
);

const showSupplierActions = computed(
  () => props.editable && canAssignRescueSupplier(props.detail),
);

const supplierSectionRef = ref<HTMLElement | null>(null);

function scrollSupplierSectionIntoView() {
  nextTick(() => {
    supplierSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

watch(
  () => props.supplierHighlight,
  (active) => {
    if (active) scrollSupplierSectionIntoView();
  },
);
</script>

<template>
  <div
    class="grid gap-6"
    :class="
      hideChat
        ? 'lg:grid-cols-1'
        : 'lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]'
    "
  >
    <OperationalRescueDetailChat
      v-if="!hideChat"
      :rescue-id="detail.id"
      :guest-token="guestToken"
      :guest-author-id="guestAuthorId"
      :external-messages="externalChatMessages"
      :send-message="sendChatMessage"
      :is-sending-external="isSendingChat"
      layout="sidebar"
      class="min-h-64 lg:sticky lg:top-0 lg:min-h-0 lg:self-start"
    />

    <div class="min-w-0 space-y-6">
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-4">
      <section
        class="space-y-3 rounded-lg border border-default bg-default p-4"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
          Cliente
        </h3>
        <div class="flex items-start gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {{ getClientInitials(detail.client_name) }}
          </div>
          <div class="min-w-0 space-y-1">
            <p class="font-semibold text-highlighted">
              {{ detail.client_name }}
            </p>
            <p v-if="detail.client_phone?.trim()" class="text-xs text-muted">
              {{ detail.client_phone }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p class="font-medium uppercase text-muted">Gestor</p>
            <p class="text-highlighted">
              {{ formatDetailPersonName(detail.operator_name) }}
            </p>
          </div>
          <div>
            <p class="font-medium uppercase text-muted">Vendedor</p>
            <p class="text-highlighted">
              {{ formatDetailPersonName(detail.seller_name) }}
            </p>
          </div>
        </div>
      </section>

      <section
        class="space-y-3 rounded-lg border border-default bg-default p-4"
      >
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
            Servicio
          </h3>
          <UButton
            v-if="editable"
            color="neutral"
            icon="i-lucide-pencil"
            label="Editar"
            size="xs"
            variant="subtle"
            @click="emit('edit-service')"
          />
        </div>
        <div class="grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <p class="font-medium uppercase text-muted">Tipo</p>
            <UBadge
              :color="serviceTypeBadge.color as 'info'"
              variant="subtle"
              size="sm"
              class="mt-1 uppercase"
            >
              {{ serviceTypeBadge.label }}
            </UBadge>
          </div>
          <div>
            <p class="font-medium uppercase text-muted">Fecha de servicio</p>
            <p class="text-highlighted">
              {{ formatDetailServiceDate(detail.created_at) }}
            </p>
          </div>
          <div>
            <p class="font-medium uppercase text-muted">Núm. económico</p>
            <p class="text-highlighted">
              {{ formatDetailOptionalText(detail.vehicle) }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p class="font-medium uppercase text-muted">Descripción del servicio</p>
            <p class="text-highlighted">
              {{ formatDetailDescription(detail.service_description) }}
            </p>
          </div>
          <div class="sm:col-span-2">
            <p class="font-medium uppercase text-muted">Notas internas</p>
            <p class="text-highlighted">
              {{ formatDetailNotes(detail.internal_notes) }}
            </p>
          </div>
        </div>
      </section>

      <section
        class="space-y-3 rounded-lg border border-default bg-default p-4"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
          Económico
        </h3>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between gap-2">
            <span class="text-muted">Precio venta</span>
            <span
              class="inline-flex items-center gap-2 font-medium text-highlighted"
            >
              {{ saleAmount }}
              <UBadge
                v-if="fromQuote"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                DESDE COTIZACIÓN
              </UBadge>
            </span>
          </div>
          <div
            v-if="!hideEconomicSensitive"
            class="flex items-center justify-between gap-2"
          >
            <span class="text-muted">Costo proveedor</span>
            <span class="font-medium text-highlighted">
              {{ formatRescueCardMoney(detail.provider_cost) }}
            </span>
          </div>
          <div
            v-if="!hideEconomicSensitive"
            class="flex items-center justify-between gap-2"
          >
            <span class="text-muted">Utilidad neta</span>
            <span class="font-medium text-success">
              {{ formatRescueCardMoney(detail.net_profit) }}
            </span>
          </div>
        </div>
        <p class="text-xs text-muted">
          Creado {{ formatElapsedSince(detail.created_at) }}
        </p>
      </section>
    </div>

    <div class="space-y-4">
      <OperationalRescueDetailClientAuthorizationSection
        v-if="!hideClientAuthorization && detail.operative_status === 'pending_authorization'"
        :rescue-id="detail.id"
        :operative-status="detail.operative_status"
      />

      <section
        v-if="!hideSupplierSection"
        ref="supplierSectionRef"
        class="space-y-3 rounded-lg border border-default bg-default p-4 transition-shadow"
        :class="supplierHighlight ? 'ring-2 ring-error' : ''"
      >
        <div class="flex items-center justify-between gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-muted">
            Proveedor
          </h3>
          <UBadge
            v-if="supplierHighlight"
            color="error"
            label="Requerido para continuar"
            size="sm"
          />
        </div>
        <div
          class="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
          :class="hasSupplier ? 'border-default bg-muted/20' : 'border-warning/30 bg-warning/5 '"
        >
          <span :class="hasSupplier ? 'text-highlighted' : 'text-warning'">
            {{
              hasSupplier
                ? (detail.supplier_name?.trim() || `Proveedor #${detail.supplier_id}`)
                : 'Sin proveedor asignado'
            }}
          </span>
          <UButton
            v-if="showSupplierActions"
            color="neutral"
            :label="hasSupplier ? 'Cambiar' : 'Asignar'"
            size="xs"
            trailing-icon="i-lucide-chevron-right"
            variant="link"
            @click="emit('assign-supplier')"
          />
        </div>
        <div class="flex items-center justify-between text-xs text-muted">
          <span>Código de Proveedor</span>
          <UBadge color="neutral" variant="subtle" size="sm"> Próximo </UBadge>
        </div>
      </section>

      <LazyOperationalRescueDetailLocationMap
        hydrate-on-visible
        :detail="detail"
        :editable="editable"
        @edit="emit('edit-location')"
      />
        </div>
      </div>

      <div v-if="$slots.afterChat">
        <slot name="afterChat" />
      </div>
    </div>
  </div>
</template>
