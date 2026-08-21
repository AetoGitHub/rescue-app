<script setup lang="ts">
const props = defineProps<{
  folio: string;
  url: string | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  uploaded: [url: string];
  remove: [];
}>();

const { uploadPurchaseOrders } = useTmsPurchaseOrderUpload();
const toast = useToast();

const pendingFile = ref<File | null>(null);
const isUploading = ref(false);

async function onFileChange(value: File | null | undefined) {
  if (!value || isUploading.value) return;

  isUploading.value = true;
  try {
    const response = await uploadPurchaseOrders([value]);
    const result = response.files[0];

    if (!result?.url) {
      toast.add({
        title: `No se pudo cargar la OC de ${props.folio}`,
        description:
          result?.error
          ?? response.batchError
          ?? 'El servicio no devolvió la URL del archivo.',
        color: 'error',
      });
      return;
    }

    emit('uploaded', result.url);
  } catch (error) {
    toast.add({
      title: `No se pudo cargar la OC de ${props.folio}`,
      description: getFetchErrorMessage(error),
      color: 'error',
    });
  } finally {
    isUploading.value = false;
    pendingFile.value = null;
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <UBadge
      v-if="isUploading"
      color="neutral"
      variant="subtle"
      size="sm"
      icon="i-lucide-loader-circle"
      label="Subiendo"
      :ui="{ leadingIcon: 'animate-spin' }"
    />

    <template v-else>
      <UButton
        v-if="url"
        :to="url"
        target="_blank"
        color="success"
        variant="subtle"
        size="sm"
        icon="i-lucide-file-check-2"
        label="Ver OC"
      />
      <UBadge
        v-else
        color="warning"
        variant="subtle"
        size="sm"
        label="Pendiente"
      />

      <UFileUpload
        v-model="pendingFile"
        variant="button"
        size="sm"
        color="neutral"
        accept=".pdf,application/pdf"
        reset
        :preview="false"
        :disabled="disabled"
        :icon="url ? 'i-lucide-refresh-cw' : 'i-lucide-upload'"
        :label="url ? 'Reemplazar' : 'Cargar PDF'"
        :aria-label="`Cargar PDF de la orden de compra de ${folio}`"
        @update:model-value="onFileChange"
      />

      <UButton
        v-if="url"
        color="neutral"
        variant="ghost"
        size="sm"
        icon="i-lucide-trash-2"
        :disabled="disabled"
        :aria-label="`Quitar PDF de la orden de compra de ${folio}`"
        @click="emit('remove')"
      />
    </template>
  </div>
</template>
