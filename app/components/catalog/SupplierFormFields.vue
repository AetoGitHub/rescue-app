<script setup lang="ts">
import type { SupplierCreateBody, SupplierServiceType } from '~/interfaces/catalogs/supplier';
import { SUPPLIER_SERVICE_TYPE_OPTIONS } from '~/constants/catalog-select-options';

const state = defineModel<SupplierCreateBody>('state', { required: true });

defineProps<{
  /** Bumped when the parent dialog opens so Google Maps can remount with correct size. */
  mapLayoutKey?: number;
}>();

function toggleServiceType(value: SupplierServiceType) {
  const current = [...state.value.service_type];
  const index = current.indexOf(value);
  if (index >= 0) {
    if (current.length === 1) return;
    current.splice(index, 1);
  } else {
    current.push(value);
  }
  state.value.service_type = current;
}

function isServiceTypeSelected(value: SupplierServiceType) {
  return state.value.service_type.includes(value);
}
</script>

<template>
  <div class="space-y-8">
    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Datos generales
      </h3>

      <UFormField label="Nombre del proveedor" name="name" required>
        <UInput
          :model-value="state.name"
          class="w-full uppercase"
          placeholder="Ej. Grúas Monterrey"
          @update:model-value="
            (value) => (state.name = formatCatalogNameInput(value))
          "
        />
      </UFormField>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Teléfono" name="phone" required>
          <UInput
            :model-value="state.phone"
            class="w-full"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            :placeholder="MEXICO_PHONE_MASK.replaceAll('#', '0')"
            @update:model-value="
              (value) => (state.phone = formatMexicoPhoneInput(value))
            "
          />
        </UFormField>
        <UFormField label="Email" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            class="w-full"
            placeholder="contacto@proveedor.com"
          />
        </UFormField>
      </div>

      <UFormField label="Tipo de servicio" name="service_type" required>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="option in SUPPLIER_SERVICE_TYPE_OPTIONS"
            :key="option.value"
            type="button"
            size="sm"
            :color="isServiceTypeSelected(option.value) ? 'primary' : 'neutral'"
            :variant="isServiceTypeSelected(option.value) ? 'solid' : 'subtle'"
            :label="option.label"
            @click="toggleServiceType(option.value)"
          />
        </div>
        <p
          v-if="state.service_type.includes('other')"
          class="mt-2 text-xs text-muted"
        >
          Indica el tipo en notas si no aparece en la lista.
        </p>
      </UFormField>

      <UFormField label="Notas" name="notes">
        <UTextarea
          v-model="state.notes"
          class="w-full"
          :rows="3"
          placeholder="Información adicional del proveedor"
        />
      </UFormField>
    </section>

    <section class="space-y-4">
      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
          Ubicación base
        </h3>
        <p class="mt-1 text-sm text-muted">
          Ubicación principal del proveedor (taller, base de operaciones).
        </p>
      </div>

      <SharedLocationPicker
        v-model:latitude="state.latitude"
        v-model:longitude="state.longitude"
        :map-layout-key="mapLayoutKey"
        empty-status-label="Sin ubicación definida (opcional — puedes agregar la ubicación después)"
      />

      <UFormField label="Descripción del lugar" name="description">
        <UTextarea
          v-model="state.description"
          class="w-full"
          :rows="2"
          placeholder="Ej: Estacionamiento Plaza Central, acceso por calle posterior"
        />
      </UFormField>
    </section>

    <section class="space-y-4">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">
        Configuración
      </h3>

      <div class="space-y-3 rounded-lg border border-default p-4">
        <UFormField name="is_trusted">
          <div class="flex items-start gap-3">
            <UCheckbox v-model="state.is_trusted" />
            <div>
              <p class="flex items-center gap-1.5 text-sm font-medium">
                <UIcon name="i-lucide-star" class="size-4 text-warning" />
                Proveedor de confianza
              </p>
              <p class="text-xs text-muted">
                Aparece priorizado al asignar servicios.
              </p>
            </div>
          </div>
        </UFormField>
      </div>
    </section>
  </div>
</template>
