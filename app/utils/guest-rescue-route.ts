/** Parsea el segmento `id` de `/rescue/:id/authorization/:token`. */
export function parseGuestRescueIdParam(
  raw: string | string[] | undefined,
): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function parseGuestAuthorizationTokenParam(
  raw: string | string[] | undefined,
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() ?? '';
}
