import { FILL_OC_STAFF_PROXY_PREFIX } from '~/constants/fill-oc-api';

export function fillOcStaffChatMessagesPath(rescueId: number): string {
  return `${FILL_OC_STAFF_PROXY_PREFIX}/chat/${rescueId}/messages/`;
}

export function fillOcStaffChatCreatePath(rescueId: number): string {
  return `${FILL_OC_STAFF_PROXY_PREFIX}/chat/${rescueId}/messages/create/`;
}

export function fillOcStaffEvidenceListPath(rescueId: number): string {
  return `${FILL_OC_STAFF_PROXY_PREFIX}/rescue/evidence/${rescueId}/`;
}

export function fillOcStaffChatQueryKey(rescueId: number): unknown[] {
  return ['fill-oc-staff-chat', rescueId];
}

/** Maps a staff evidence URL (`/api/rescue/evidence/1/`) onto the fill-oc proxy. */
export function toFillOcStaffProxyPath(apiPath: string): string {
  const path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  if (path.startsWith(`${FILL_OC_STAFF_PROXY_PREFIX}/`)) return path;
  if (path.startsWith('/api/')) {
    return `${FILL_OC_STAFF_PROXY_PREFIX}/${path.slice('/api/'.length)}`;
  }
  return `${FILL_OC_STAFF_PROXY_PREFIX}${path}`;
}

export function djangoPathFromFillOcStaffProxy(nitroPath: string): string | null {
  const pathname = nitroPath.split('?')[0] ?? nitroPath;
  const prefix = `${FILL_OC_STAFF_PROXY_PREFIX}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length);
  if (!rest) return null;
  return `/api/${rest}`;
}
