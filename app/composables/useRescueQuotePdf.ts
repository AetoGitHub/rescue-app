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
    if (isViewingPdf.value) return;
    isViewingPdf.value = true;

    /**
     * Safari/iOS solo honra `window.open` si ocurre de forma síncrona dentro
     * del gesto de usuario. Abrimos la pestaña en blanco antes del `await` y
     * navegamos a la URL real una vez resuelto el fetch.
     */
    const previewTab = window.open('', '_blank');

    try {
      const { url } = await fetchQuotePdfUrl(regenerate);

      if (previewTab) {
        previewTab.location.href = url;
      }
    } catch (error) {
      previewTab?.close();
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
    if (id == null || isDownloadingPdf.value) return;

    isDownloadingPdf.value = true;

    try {
      const blob = await apiFetch<Blob>(`/api/quotes/${id}`, {
        query: buildQuery(regenerate, true),
        responseType: 'blob',
      });

      await shareOrDownloadBlob(blob, `cotizacion_rescue_${id}.pdf`);
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
