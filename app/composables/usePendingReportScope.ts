/**
 * Qué variante del API consumen Por Facturar / Por Cobrar.
 *
 * - `admin`: `/api/dashboard/...` (incluye costo técnico).
 * - `client`: `/api/client/...` para el portal de cliente; misma forma de
 *   respuesta pero sin `technical_cost`.
 *
 * Cada página la fija al montarse (`/admin/*` → admin, `/portal-cliente/*` →
 * client), antes de usar los composables de listas.
 */
export type PendingReportScope = 'admin' | 'client';

export function usePendingReportScope() {
  return useState<PendingReportScope>('pending-report-scope', () => 'admin');
}
