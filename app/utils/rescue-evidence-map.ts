import type {
  RescueEvidence,
  RescueEvidenceType,
} from '~/interfaces/rescue/evidence';

function toEvidenceType(value: unknown): RescueEvidenceType | null {
  if (value === 'service' || value === 'payment_provider') return value;
  return null;
}

function extractEvidenceRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload as Record<string, unknown>[];
  }
  if (!payload || typeof payload !== 'object') return [];

  const obj = payload as Record<string, unknown>;
  for (const key of ['results', 'evidences', 'data'] as const) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value as Record<string, unknown>[];
    }
  }
  return [];
}

export function mapRescueEvidenceFromApi(
  row: Record<string, unknown>,
): RescueEvidence | null {
  const id = Number(row.id);
  const type = toEvidenceType(row.type);
  const url = typeof row.url === 'string' ? row.url : '';
  if (!Number.isFinite(id) || type == null || !url) return null;
  return { id, type, url };
}

export function mapRescueEvidenceListFromApi(
  payload: unknown,
): RescueEvidence[] {
  return extractEvidenceRows(payload)
    .map(mapRescueEvidenceFromApi)
    .filter((item): item is RescueEvidence => item != null);
}
