import type { H3Event } from 'h3';
import { REQUEST_ID_HEADER } from '#shared/constants/session';

const SAFE_REQUEST_ID = /^[\w.-]{8,128}$/;

export function sanitizeIncomingRequestId(
  incoming: string | undefined,
): string | null {
  const value = incoming?.trim();
  if (value && SAFE_REQUEST_ID.test(value)) return value;
  return null;
}

export function resolveRequestId(event: H3Event): string {
  return sanitizeIncomingRequestId(getHeader(event, REQUEST_ID_HEADER))
    ?? crypto.randomUUID();
}

export function attachRequestId(event: H3Event): string {
  const existing = getResponseHeader(event, REQUEST_ID_HEADER);
  if (typeof existing === 'string' && existing.trim()) return existing.trim();
  const requestId = resolveRequestId(event);
  setResponseHeader(event, REQUEST_ID_HEADER, requestId);
  return requestId;
}

