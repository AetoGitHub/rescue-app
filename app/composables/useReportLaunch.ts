import type { CatalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import type { RescueServiceType } from '~/interfaces/rescue';

export type ReportStatusFilterType = 'admin' | 'operative';

export interface RescuesExcelReportLaunch {
  report: 'rescues_excel';
  folio?: string;
  serviceTypes?: RescueServiceType[];
  company?: CatalogDropdownSelection;
  client?: CatalogDropdownSelection;
  vehicles?: string[];
  statusType?: ReportStatusFilterType;
  /** 'all' selecciona todos los status disponibles para ese tipo. */
  statusValues?: string[] | 'all';
}

/**
 * Union ampliable: cada reporte nuevo que se agregue a /admin/reportes suma
 * aqui su propio miembro, discriminado por `report`.
 */
export type ReportLaunch = RescuesExcelReportLaunch;

/**
 * Contexto compartido para abrir /admin/reportes con un reporte y filtros ya
 * precargados desde otra pantalla (ej. compañía/cliente ya elegidos en el
 * board Administrativo). /admin/reportes lo consume una sola vez al montar y
 * lo limpia — no persiste entre visitas.
 */
export function useReportLaunch() {
  return useState<ReportLaunch | null>('admin-report-launch', () => null);
}

/**
 * Guarda el contexto de lanzamiento y navega a /admin/reportes. Cualquier
 * pantalla que quiera abrir un reporte con filtros ya aplicados usa esto en
 * vez de duplicar los filtros/el modal localmente.
 */
export function useReportLauncher() {
  const pendingLaunch = useReportLaunch();

  function launchReport(launch: ReportLaunch) {
    pendingLaunch.value = launch;
    return navigateTo('/admin/reportes');
  }

  return { launchReport };
}
