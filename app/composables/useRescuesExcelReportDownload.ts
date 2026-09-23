import { DASHBOARD_REPORT_RESCUES_EXCEL_PATH } from '~/constants/dashboard-report-api';

/**
 * Descarga el reporte Excel de rescates (GET /api/dashboard/report/rescues/excel/)
 * dado un query ya armado. Reutilizable desde cualquier pantalla que quiera
 * ofrecer este mismo reporte, con o sin un modal de por medio (ej. el modal
 * de /admin/reportes, o un botón de descarga directa como en /admin/por-facturar).
 */
export function useRescuesExcelReportDownload() {
  const toast = useToast();
  const isDownloading = ref(false);

  async function downloadRescuesExcelReport(
    query: Record<string, string | undefined>,
  ): Promise<boolean> {
    if (isDownloading.value) return false;

    isDownloading.value = true;
    try {
      const response = await $fetch.raw<Blob>(DASHBOARD_REPORT_RESCUES_EXCEL_PATH, {
        responseType: 'blob',
        query,
      });
      const filename =
        filenameFromContentDisposition(response.headers.get('content-disposition'))
        || 'reporte_rescates.xlsx';
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

  return { downloadRescuesExcelReport, isDownloading };
}
