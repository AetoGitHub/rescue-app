import { extractFetchErrorData } from '~/utils/fetch-error-message';

export function isRescueQuoteNotFoundError(error: unknown): boolean {
  const data = extractFetchErrorData(error);
  const status = data?.status;
  return typeof status === 'string' && /no encontrado/i.test(status);
}
