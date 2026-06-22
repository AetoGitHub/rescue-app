function stringifyDetail(detail: unknown): string | null {
  if (typeof detail === 'string') {
    const s = detail.trim();
    return s.length > 0 ? s : null;
  }
  if (Array.isArray(detail)) {
    const parts = detail
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts.join('. ') : null;
  }
  return null;
}

export function forwardFetchError(error: unknown): never {
  const statusCode =
    error && typeof error === 'object'
      ? Number(
          (error as { statusCode?: number; status?: number }).statusCode
            ?? (error as { status?: number }).status,
        ) || 502
      : 502;

  const data =
    error && typeof error === 'object' && 'data' in error
      ? (error as { data: unknown }).data
      : undefined;

  const detail =
    data && typeof data === 'object' && !Array.isArray(data)
      ? stringifyDetail((data as Record<string, unknown>).detail)
        ?? stringifyDetail((data as Record<string, unknown>).message)
      : null;

  throw createError({
    statusCode,
    message: detail ?? 'Error en la solicitud',
    data,
  });
}
