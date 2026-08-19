<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import type { infer as ZodInfer } from 'zod';
import { CLIENT_CONTACT_DETAIL_PATH } from '~/constants/client-api';
import {
  clientContactFormSchema,
  clientContactFormToCreateBody,
  clientContactFormToUpdateBody,
} from '~/schemas/catalog-create';

const props = defineProps<{
  clientId: number;
  /** Whether the client already has a responsible contact elsewhere. */
  hasResponsible?: boolean;
}>();

const emit = defineEmits<{
  saved: [];
  cancelled: [];
}>();

const toast = useToast();

const editingId = ref<number | null>(null);
const detailPending = ref(false);
/** True when the contact being edited is already the responsible one. */
const editingIsResponsible = ref(false);

const isEdit = computed(() => editingId.value != null);

/** Only one responsible contact: lock the checkbox unless editing that contact or none exists yet. */
const canToggleResponsible = computed(
  () => !(props.hasResponsible && !editingIsResponsible.value),
);

function emptyState(
  defaults?: Partial<ZodInfer<typeof clientContactFormSchema>>,
): ZodInfer<typeof clientContactFormSchema> {
  return {
    name: '',
    position: '',
    email: '',
    phone: '',
    whatsapp: '',
    is_authorizer: false,
    receives_quotes: false,
    receives_oc_reminders: false,
    receives_account_status: false,
    is_billing_contact: false,
    is_responsible: defaults?.is_responsible ?? false,
    is_active: true,
  };
}

const state = reactive(emptyState());

function resetForm() {
  Object.assign(state, emptyState());
  editingId.value = null;
  editingIsResponsible.value = false;
}

function prepareCreate() {
  resetForm();
  // Encourage assigning a responsible when the client still has none.
  Object.assign(
    state,
    emptyState({ is_responsible: props.hasResponsible !== true }),
  );
}

async function openEdit(id: number) {
  editingId.value = id;
  editingIsResponsible.value = false;
  Object.assign(state, emptyState());
  detailPending.value = true;
  try {
    const raw = await $fetch<Record<string, unknown>>(
      CLIENT_CONTACT_DETAIL_PATH(id),
    );
    const detail = mapClientContactDetail(raw);
    Object.assign(state, detail);
    editingIsResponsible.value = detail.is_responsible;
  } catch (e) {
    console.error(e);
    toast.add({
      title: 'No se pudo cargar el contacto',
      description: getFetchErrorMessage(e),
      color: 'error',
    });
    resetForm();
  } finally {
    detailPending.value = false;
  }
}

defineExpose({ prepareCreate, openEdit, resetForm });

const { createContactAsync, updateContactAsync, isSaving } = useClientContactMutations({
  clientId: computed(() => props.clientId),
});

const formRef = ref<{ submit: () => Promise<void> } | null>(null);

async function onSubmit(payload: FormSubmitEvent<ZodInfer<typeof clientContactFormSchema>>) {
  if (isSaving.value) return;
  const id = editingId.value;
  try {
    const saved
      = id != null
        ? await updateContactAsync({
            contactId: id,
            body: clientContactFormToUpdateBody(props.clientId, payload.data),
          })
        : await createContactAsync(
            clientContactFormToCreateBody(props.clientId, payload.data),
          );
    if (!saved) return;
    resetForm();
    emit('saved');
  } catch {
    // Toast handled in mutation onError.
  }
}

const { onFormError } = useFormValidationFeedback();

function cancel() {
  if (isSaving.value) return;
  resetForm();
  emit('cancelled');
}

async function requestSubmit() {
  if (isSaving.value) return;
  await formRef.value?.submit();
}
</script>

<template>
  <section class="rounded-lg border border-default bg-default p-4 sm:p-5">
    <div v-if="detailPending && isEdit" class="flex justify-center py-10">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <UForm
      v-show="!detailPending || !isEdit"
      ref="formRef"
      :schema="clientContactFormSchema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
      @error="onFormError"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UFormField label="Nombre" name="name" required>
          <template #label>
            <span class="text-xs font-medium uppercase tracking-wide text-muted">
              Nombre <span class="text-error">*</span>
            </span>
          </template>
          <UInput
            :model-value="state.name"
            class="w-full uppercase"
            @update:model-value="(value) => (state.name = formatCatalogNameInput(value))"
          />
        </UFormField>

        <UFormField label="Cargo" name="position" required>
          <template #label>
            <span class="text-xs font-medium uppercase tracking-wide text-muted">
              Cargo
            </span>
          </template>
          <UInput v-model="state.position" class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <template #label>
            <span class="text-xs font-medium uppercase tracking-wide text-muted">
              Email
            </span>
          </template>
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>

        <UFormField label="Teléfono" name="phone" required>
          <template #label>
            <span class="text-xs font-medium uppercase tracking-wide text-muted">
              Teléfono
            </span>
          </template>
          <UInput
            :model-value="state.phone"
            class="w-full"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            :placeholder="MEXICO_PHONE_MASK.replaceAll('#', '0')"
            @update:model-value="(value) => (state.phone = formatMexicoPhoneInput(value))"
          />
        </UFormField>

        <UFormField label="WhatsApp" name="whatsapp" required class="sm:col-span-1">
          <template #label>
            <span class="text-xs font-medium uppercase tracking-wide text-muted">
              WhatsApp
            </span>
          </template>
          <UInput
            :model-value="state.whatsapp"
            class="w-full"
            type="tel"
            inputmode="tel"
            :placeholder="MEXICO_PHONE_MASK.replaceAll('#', '0')"
            @update:model-value="(value) => (state.whatsapp = formatMexicoPhoneInput(value))"
          />
        </UFormField>
      </div>

      <div class="space-y-3 border-t border-default pt-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted">
          Notificaciones
        </p>

        <UFormField name="is_authorizer">
          <UCheckbox v-model="state.is_authorizer">
            <template #label>
              <span class="inline-flex items-center gap-1.5">
                Es autorizador
                <UIcon
                  name="i-lucide-shield-check"
                  class="size-4 text-primary"
                />
              </span>
            </template>
          </UCheckbox>
        </UFormField>

        <UFormField name="receives_quotes">
          <UCheckbox
            v-model="state.receives_quotes"
            label="Recibe cotizaciones"
          />
        </UFormField>

        <UFormField name="receives_oc_reminders">
          <UCheckbox
            v-model="state.receives_oc_reminders"
            label="Recibe recordatorios de OC"
          />
        </UFormField>

        <UFormField name="receives_account_status">
          <UCheckbox
            v-model="state.receives_account_status"
            label="Recibe estado de cuenta"
          />
        </UFormField>

        <UFormField name="is_billing_contact">
          <UCheckbox
            v-model="state.is_billing_contact"
            label="Cobranza (contacto de Cobranza IA)"
          />
        </UFormField>

        <UFormField name="is_responsible">
          <UCheckbox
            v-model="state.is_responsible"
            :disabled="!canToggleResponsible"
            label="Es responsable"
          />
          <p
            v-if="!canToggleResponsible"
            class="mt-1 text-xs text-muted"
          >
            Este cliente ya tiene un contacto responsable.
          </p>
        </UFormField>
      </div>

      <div class="flex justify-end gap-2 border-t border-default pt-4">
        <UButton
          type="button"
          color="neutral"
          variant="outline"
          label="Cancelar"
          :disabled="isSaving"
          @click="cancel"
        />
        <UButton
          type="button"
          label="Guardar"
          :loading="isSaving || (detailPending && isEdit)"
          :disabled="isSaving || (detailPending && isEdit)"
          @click="requestSubmit"
        />
      </div>
    </UForm>
  </section>
</template>
