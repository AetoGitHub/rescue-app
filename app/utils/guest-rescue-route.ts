type GuestRouteParam = string | (string | null)[] | null | undefined;

/** Parsea el segmento `id` de `/rescue/:id/...` (path param o query param). */
export function parseGuestRescueIdParam(raw: GuestRouteParam): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function parseGuestAuthorizationTokenParam(raw: GuestRouteParam): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? '';
}
