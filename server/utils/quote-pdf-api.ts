import { QUOTE_PDF_API_DEFAULT } from '~/constants/quote-pdf-api';

export function resolveQuotePdfApiUrl(): string {
  const url = useRuntimeConfig().quotePdfApiUrl?.trim();
  return url || QUOTE_PDF_API_DEFAULT;
}

export function quotePdfAuthorizationHeader(token: string): string {
  return `Token ${token}`;
}

export function parseQuotePdfRescueId(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === '') return null;
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export function buildQuotePdfUpstreamQuery(query: {
  regenerate?: unknown;
  download?: unknown;
}): Record<string, string> {
  const params: Record<string, string> = {};

  if (query.regenerate === true || query.regenerate === 'true') {
    params.regenerate = 'true';
  }

  if (query.download === true || query.download === 'true') {
    params.download = 'true';
  }

  return params;
}
