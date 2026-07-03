export function resolveRescueGuestApiUrl(): string {
  return useRuntimeConfig().apiUrl?.trim() ?? '';
}

export function parseRescueGuestIdParam(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') return null;
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export function parseRescueGuestTokenParam(raw: string | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
