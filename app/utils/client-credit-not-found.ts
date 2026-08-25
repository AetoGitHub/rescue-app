import {
  extractFetchErrorData,
  getFetchErrorMessage,
  getFetchStatusCode,
} from '~/utils/fetch-error-message';

export function isClientCreditNotFoundError(error: unknown): boolean {
  const code = getFetchStatusCode(error);
  if (code === 400 || code === 404) return true;
  const data = extractFetchErrorData(error);
  const status = data?.status;
  return typeof status === 'string' && /no encontrado/i.test(status);
}

export function isCompanyCreditServerError(error: unknown): boolean {
  return getFetchStatusCode(error) === 500;
}

export function getCompanyCreditLoadErrorMessage(error: unknown): string {
  if (isCompanyCreditServerError(error)) {
    return 'Error del servidor al cargar el crédito. El problema está en el servidor, no en el proxy.';
  }
  return getFetchErrorMessage(error);
}
