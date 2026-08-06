export function parsePositiveIntQuery(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' && typeof raw !== 'number') return null;

  const parsed = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

export function parseOperatorQuery(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null) return null;

  const operator = String(raw).trim();
  return operator.length > 0 ? operator : null;
}

export type OperativeBalanceBuiltQuery =
  | { user: string; test_days?: string }
  | { operator: string; test_days?: string };

export function buildOperativeBalanceQuery(
  query: { operator?: unknown; user?: unknown; test_days?: unknown },
  options: { dev: boolean },
): OperativeBalanceBuiltQuery | null {
  const user = parseOperatorQuery(query.user);
  const operator = parseOperatorQuery(query.operator);

  if (user == null && operator == null) return null;

  const result: OperativeBalanceBuiltQuery = user != null
    ? { user }
    : { operator: operator! };

  if (options.dev) {
    const testDays = parsePositiveIntQuery(query.test_days);
    if (testDays != null) {
      result.test_days = String(testDays);
    }
  }

  return result;
}
