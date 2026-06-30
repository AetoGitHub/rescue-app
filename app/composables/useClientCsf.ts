import { useMutation } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { CLIENT_CSF_UPDATE_PATH } from '~/constants/client-api';
import { RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT } from '~/constants/rescue-evidence-api';
import type { ClientCsfUpdateBody } from '~/interfaces/catalogs/client';
import {
  buildClientCsfStoragePath,
  isClientCsfFileAllowed,
} from '~/utils/client-csf-upload';

export function useClientCsf(options: {
  clientId: MaybeRefOrGetter<number | null>;
}) {
  const toast = useToast();
  const runtimeConfig = useRuntimeConfig();
  const clientId = computed(() => toValue(options.clientId));

  const webhookUrl = computed(
    () =>
      runtimeConfig.public.firebaseUploadWebhookUrl
      || RESCUE_FIREBASE_UPLOAD_WEBHOOK_DEFAULT,
  );

  const isUploading = ref(false);
  const pendingUrl = ref<string | null>(null);

  const { mutateAsync: saveCsfAsync, asyncStatus: saveStatus } = useMutation({
    mutation: (body: ClientCsfUpdateBody) => {
      const id = clientId.value;
      if (id == null) {
        return Promise.reject(new Error('Cliente no disponible'));
      }
      return $fetch(CLIENT_CSF_UPDATE_PATH(id), { method: 'PUT', body });
    },
    onSuccess() {
      toast.add({ title: 'CSF guardada', color: 'success' });
    },
    onError: (e) => {
      toast.add({
        title: 'No se pudo guardar la CSF',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
    },
  });

  const isSaving = computed(
    () => isUploading.value || saveStatus.value === 'loading',
  );

  const hasPendingUpload = computed(
    () => pendingUrl.value != null && pendingUrl.value.trim() !== '',
  );

  async function uploadFile(file: File): Promise<string | null> {
    const id = clientId.value;
    if (id == null) return null;

    if (!isClientCsfFileAllowed(file)) {
      toast.add({
        title: 'Archivo no válido',
        description: 'Solo se permiten archivos PDF de hasta 10 MB.',
        color: 'error',
      });
      return null;
    }

    isUploading.value = true;
    pendingUrl.value = null;
    try {
      const url = await uploadFileToFirebaseGeneral(
        file,
        buildClientCsfStoragePath(id),
        webhookUrl.value,
      );
      pendingUrl.value = url;
      return url;
    } catch (e) {
      toast.add({
        title: 'No se pudo subir el archivo',
        description: getFetchErrorMessage(e),
        color: 'error',
      });
      return null;
    } finally {
      isUploading.value = false;
    }
  }

  async function savePendingCsf(onSaved?: (url: string) => void) {
    const url = pendingUrl.value?.trim();
    if (!url) return;
    try {
      await saveCsfAsync({ csf: url });
      onSaved?.(url);
      pendingUrl.value = null;
    } catch {
      // Toast handled in mutation onError.
    }
  }

  function resetPendingUpload() {
    pendingUrl.value = null;
  }

  return {
    uploadFile,
    savePendingCsf,
    resetPendingUpload,
    pendingUrl,
    isUploading,
    isSaving,
    hasPendingUpload,
  };
}
