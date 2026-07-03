import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import { mapRescueCardDetailFromApi } from '~/utils/operational-rescue-detail';

/**
 * Mapea GET /api/rescue/cards/<id>/<token>/ al detalle interno.
 * El backend devuelve el mismo shape plano que el detalle operativo; también
 * acepta wrappers legacy ({ rescue }, { card }, { detail }, { data }).
 */
export function mapGuestRescueDetailFromApproveApi(raw: unknown): RescueCardDetail {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Respuesta de autorización inválida');
  }

  const record = raw as Record<string, unknown>;
  const nested =
    record.rescue ?? record.card ?? record.detail ?? record.data ?? raw;

  if (nested == null || typeof nested !== 'object' || Array.isArray(nested)) {
    throw new Error('Respuesta de autorización inválida');
  }

  return mapRescueCardDetailFromApi(nested as RescueCardDetail);
}
