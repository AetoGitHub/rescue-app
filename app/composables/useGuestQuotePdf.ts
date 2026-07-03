import type { MaybeRefOrGetter } from 'vue';

/**
 * Fase 2: GET /api/rescue/{rescueId}/authorization/{token}/quote/pdf/
 */
export function useGuestQuotePdf(
  rescueId: MaybeRefOrGetter<number | null>,
  token: MaybeRefOrGetter<string>,
) {
  const toast = useToast();

  const isViewingPdf = ref(false);
  const isDownloadingPdf = ref(false);

  function showNotConnectedToast() {
    toast.add({
      title: 'PDF no disponible',
      description: 'Disponible cuando el backend esté conectado.',
      color: 'warning',
    });
  }

  async function viewQuotePdf() {
    if (toValue(rescueId) == null || !toValue(token)?.trim()) return;
    isViewingPdf.value = true;
    try {
      showNotConnectedToast();
    } finally {
      isViewingPdf.value = false;
    }
  }

  async function downloadQuotePdf() {
    if (toValue(rescueId) == null || !toValue(token)?.trim()) return;
    isDownloadingPdf.value = true;
    try {
      showNotConnectedToast();
    } finally {
      isDownloadingPdf.value = false;
    }
  }

  return {
    isViewingPdf,
    isDownloadingPdf,
    viewQuotePdf,
    downloadQuotePdf,
  };
}
