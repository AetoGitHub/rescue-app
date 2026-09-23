import { DASHBOARD_REPORT_RESCUES_EXCEL_PATH } from '~/constants/dashboard-report-api';

/**
 * Descarga el reporte Excel de rescates (GET /api/dashboard/report/rescues/excel/)
 * dado un query ya armado. Reutilizable desde cualquier pantalla que quiera
 * ofrecer este mismo reporte, con o sin un modal de por medio (ej. el modal
 * de /admin/reportes, o un botón de descarga directa como en /admin/por-facturar).
 */
export function useRescuesExcelReportDownload() {
  const { download, isDownloading } = useExcelReportDownload(
    DASHBOARD_REPORT_RESCUES_EXCEL_PATH,
    'reporte_rescates.xlsx',
  );

  return { downloadRescuesExcelReport: download, isDownloading };
}
