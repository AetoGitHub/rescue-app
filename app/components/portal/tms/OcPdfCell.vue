<script setup lang="ts">
const props = defineProps<{
  folio: string;
  url: string | null;
  disabled?: boolean;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  uploaded: [url: string];
}>();

const { uploadPurchaseOrders } = useTmsPurchaseOrderUpload();
const toast = useToast();

const pendingFile = ref<File | null>(null);
const isUploading = ref(false);

async function onFileChange(value: File | null | undefined) {
  if (!value || isUploading.value || props.readonly) return;

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
  <div class="flex flex-col items-start gap-1">
    <UBadge
      v-if="isUploading"
      color="neutral"
      variant="subtle"
      size="xs"
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
        size="xs"
        icon="i-lucide-file-check-2"
        label="Ver OC"
      />
      <PortalTmsMissingValue
        v-else
        label="Sin PDF"
      />

      <div
        v-if="!readonly && !url"
        class="flex items-center gap-1"
      >
        <UFileUpload
          v-model="pendingFile"
          variant="button"
          size="xs"
          color="neutral"
          accept=".pdf,application/pdf"
          reset
          :preview="false"
          :disabled="disabled"
          icon="i-lucide-upload"
          label="Cargar"
          :aria-label="`Cargar PDF de la orden de compra de ${folio}`"
          @update:model-value="onFileChange"
        />
      </div>
    </template>
  </div>
</template>
