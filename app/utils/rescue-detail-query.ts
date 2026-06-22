export function parseRescueQueryParam(value: unknown): number | null {
  const parsed = Number(typeof value === 'string' ? value.trim() : value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}
