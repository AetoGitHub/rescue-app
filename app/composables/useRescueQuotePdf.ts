export function useRescueQuotePdf(rescueId: MaybeRefOrGetter<number | null>) {
  const apiFetch = useApiFetch();
  const toast = useToast();

  const isViewingPdf = ref(false);
  const isDownloadingPdf = ref(false);

  function buildQuery(regenerate: boolean, download: boolean) {
    const query: Record<string, string> = {};

    if (regenerate) {
      query.regenerate = 'true';
    }

    if (download) {
      query.download = 'true';
    }

    return query;
  }

  async function fetchQuotePdfUrl(regenerate = false) {
    const id = toValue(rescueId);
    if (id == null) {
      throw new Error('Rescate no disponible');
    }

    return apiFetch<{ url: string }>(`/api/quotes/${id}`, {
      query: buildQuery(regenerate, false),
    });
  }

  async function viewQuotePdf(regenerate = false) {
    isViewingPdf.value = true;

    try {
      const { url } = await fetchQuotePdfUrl(regenerate);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.add({
        title: 'No se pudo generar la cotización',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    } finally {
      isViewingPdf.value = false;
    }
  }

  async function downloadQuotePdf(regenerate = false) {
    const id = toValue(rescueId);
    if (id == null) return;

    isDownloadingPdf.value = true;

    try {
      const blob = await apiFetch<Blob>(`/api/quotes/${id}`, {
        query: buildQuery(regenerate, true),
        responseType: 'blob',
      });

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `cotizacion_rescue_${id}.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.add({
        title: 'No se pudo descargar la cotización',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
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
