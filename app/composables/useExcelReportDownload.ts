/**
 * Descarga un reporte Excel de `path` dado un query ya armado. Capa base
 * reutilizada por los composables de cada reporte concreto (ej.
 * `useRescuesExcelReportDownload`) y por componentes genéricos como
 * `ReportesDateRangeExcelReportModal`, para no repetir el fetch/blob/toast en
 * cada reporte nuevo que se agregue a /admin/reportes.
 */
export function useExcelReportDownload(path: string, defaultFilename: string) {
  const toast = useToast();
  const isDownloading = ref(false);

  async function download(
    query: Record<string, string | undefined>,
  ): Promise<boolean> {
    if (isDownloading.value) return false;

    isDownloading.value = true;
    try {
      // No se fija `responseType: 'blob'` a proposito: ofetch aplicaria ese
      // parseo tanto al 200 (xlsx) como a un eventual error 400/500 (JSON de
      // Django), dejando `error.data` como un Blob opaco e imposible de leer
      // en el catch -- getFetchErrorMessage necesita el JSON parseado para
      // mostrar el detalle real del backend en vez de un mensaje generico.
      // Sin `responseType`, ofetch detecta el tipo por el content-type real
      // de cada respuesta (blob para el xlsx, json para el error).
      const response = await $fetch.raw<Blob>(path, { query });
      const filename =
        filenameFromContentDisposition(response.headers.get('content-disposition'))
        || defaultFilename;
      downloadBlob(response._data as Blob, filename);
      return true;
    } catch (error) {
      toast.add({
        title: 'No se pudo descargar el Excel',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    } finally {
      isDownloading.value = false;
    }
  }

  return { download, isDownloading };
}
