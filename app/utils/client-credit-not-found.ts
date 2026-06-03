import { extractFetchErrorData } from '~/utils/fetch-error-message';

function getFetchStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const e = error as Record<string, unknown>;
  const code = e.statusCode ?? e.status;
  if (typeof code === 'number' && Number.isFinite(code)) return code;
  return undefined;
}

export function isClientCreditNotFoundError(error: unknown): boolean {
  if (getFetchStatusCode(error) === 404) return true;
  const data = extractFetchErrorData(error);
  const status = data?.status;
  return typeof status === 'string' && /no encontrado/i.test(status);
}
