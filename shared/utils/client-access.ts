/**
 * Portal de cliente: modelo "denegado por defecto".
 *
 * Un usuario con rol `client` solo puede abrir las páginas y consumir los
 * endpoints listados aquí. Para concederle algo nuevo, se agrega el prefijo a
 * la lista correspondiente; no existe otra vía.
 */

export const CLIENT_HOME = '/portal-cliente/por-facturar';

/** Páginas del portal a las que el cliente tiene acceso explícito. */
export const CLIENT_ALLOWED_PAGE_PREFIXES = [
  '/portal-cliente/por-facturar',
  '/portal-cliente/por-cobrar',
] as const;

/**
 * Páginas que no dependen del rol (auth o links públicos con token/api key).
 * Un cliente con sesión debe poder abrirlas, p. ej. desde un correo.
 */
export const CLIENT_PUBLIC_PAGE_PREFIXES = [
  '/login',
  '/password-reset',
  '/rescue',
  '/admin/llenar-oc',
] as const;

/**
 * Endpoints del proxy que el cliente puede consumir.
 *
 * Los reportes vienen de `/api/client/` (sin costo técnico). De
 * `/api/dashboard/` solo quedan los que aún no tienen copia en `client`:
 * resúmenes, dropdowns de filtros y el Excel. Nunca las listas de
 * `/api/dashboard/`, porque incluyen `technical_cost`.
 */
export const CLIENT_ALLOWED_API_PREFIXES = [
  '/api/client/pending_invoice',
  '/api/client/pending_charge',
  '/api/client/by_responsible',
  '/api/client/company_matrix',
  '/api/client/dropdown',
  '/api/dashboard/pending_invoice/summary',
  '/api/dashboard/pending_charge/summary',
  '/api/dashboard/pending_invoice/companies/dropdown',
  '/api/dashboard/pending_invoice/clients/dropdown',
  '/api/dashboard/pending_invoice/operators/dropdown',
  '/api/dashboard/pending_invoice/vehicles/dropdown',
  '/api/dashboard/pending_invoice/authorizers/dropdown',
  '/api/dashboard/pending_charge/companies/dropdown',
  '/api/dashboard/pending_charge/clients/dropdown',
  '/api/dashboard/report/rescues/excel',
] as const;

/** Compara por segmento: `/a/b` coincide con `/a/b` y `/a/b/c`, no con `/a/bc`. */
function matchesPrefix(path: string, prefix: string): boolean {
  const pathname = path.split('?')[0] ?? path;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function matchesAny(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => matchesPrefix(path, prefix));
}

export function isClientPageAllowed(path: string): boolean {
  return matchesAny(path, CLIENT_ALLOWED_PAGE_PREFIXES)
    || matchesAny(path, CLIENT_PUBLIC_PAGE_PREFIXES);
}

export function isClientApiAllowed(path: string): boolean {
  return matchesAny(path, CLIENT_ALLOWED_API_PREFIXES);
}
