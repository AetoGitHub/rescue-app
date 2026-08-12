<script setup lang="ts">
import type { ClientContact } from '~/interfaces/catalogs/client';

const props = defineProps<{
  clientId: number;
  enabled?: boolean;
  scrollRootRef?: HTMLElement | null;
}>();

const contactFormRef = ref<{
  prepareCreate: () => void;
  openEdit: (id: number) => void | Promise<void>;
  resetForm: () => void;
} | null>(null);

const listTableRef = shallowRef<{ $el?: HTMLElement | null } | null>(null);
const showContactForm = ref(false);

const {
  rows,
  asyncStatus,
  hasNextPage,
  loadNextPage,
  isInitialLoading,
} = useClientContactsList({
  clientId: computed(() => props.clientId),
  enabled: computed(() => props.enabled ?? true),
});

const {
  hasResponsible,
  isPending: isHasResponsiblePending,
} = useClientHasResponsible({
  clientId: computed(() => props.clientId),
  enabled: computed(() => props.enabled ?? true),
});

const scrollRoot = computed(() => props.scrollRootRef ?? null);

usePaginatedTableInfiniteScroll({
  tableRef: listTableRef,
  scrollRootRef: scrollRoot,
  hasNextPage,
  loadNextPage,
  asyncStatus,
});

const { removeContact, isRemoving } = useClientContactMutations({
  clientId: computed(() => props.clientId),
});

const selectedContactId = ref<number | null>(null);
const removingContactId = ref<number | null>(null);

watch(isRemoving, (loading) => {
  if (!loading) {
    removingContactId.value = null;
  }
});

function openAddContact() {
  selectedContactId.value = null;
  showContactForm.value = true;
  nextTick(() => {
    contactFormRef.value?.prepareCreate();
  });
}

function onContactSelect(contact: ClientContact) {
  selectedContactId.value = contact.id;
  showContactForm.value = true;
  nextTick(() => {
    void contactFormRef.value?.openEdit(contact.id);
  });
}

async function confirmRemove(contact: ClientContact) {
  if (!import.meta.client) return;
  if (!window.confirm(`¿Eliminar el contacto «${contact.name}»?`)) return;

  if (selectedContactId.value === contact.id) {
    showContactForm.value = false;
    contactFormRef.value?.resetForm();
    selectedContactId.value = null;
  }

  removingContactId.value = contact.id;
  removeContact(contact.id);
}

function closeContactForm() {
  showContactForm.value = false;
  selectedContactId.value = null;
}

function onFormSaved() {
  closeContactForm();
}

function onFormCancelled() {
  closeContactForm();
}
</script>

<template>
  <div class="space-y-5 pt-2">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-sm font-semibold uppercase tracking-wider text-primary">
        Contactos del cliente
      </h3>

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          type="button"
          icon="i-lucide-plus"
          label="Agregar contacto"
          size="sm"
          @click="openAddContact"
        />
      </div>
    </div>

    <UAlert
      v-if="!isHasResponsiblePending && !hasResponsible"
      color="warning"
      variant="subtle"
      icon="i-lucide-user-round-x"
      title="Sin contacto responsable"
      description="Marca al menos un contacto como responsable para este cliente."
    />

    <CatalogClientContactForm
      v-if="showContactForm"
      ref="contactFormRef"
      :client-id="clientId"
      :has-responsible="hasResponsible"
      @saved="onFormSaved"
      @cancelled="onFormCancelled"
    />

    <div v-if="isInitialLoading" class="flex justify-center py-8">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="rows.length === 0"
      class="rounded-lg border border-dashed border-default px-4 py-8 text-center text-sm text-muted"
    >
      No hay contactos registrados. Usa «Agregar contacto» para crear uno.
    </div>

    <div v-else class="space-y-3">
      <CatalogClientContactCard
        v-for="contact in rows"
        :key="contact.id"
        :contact="contact"
        :selected="selectedContactId === contact.id"
        :removing="isRemoving && removingContactId === contact.id"
        @select="onContactSelect(contact)"
        @remove="confirmRemove(contact)"
      />
    </div>
  </div>
</template>
