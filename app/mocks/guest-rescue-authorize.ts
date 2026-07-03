import type { RescueChatMessage } from '~/interfaces/rescue';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { GUEST_AUTHORIZE_INVALID_TOKEN } from '~/constants/guest-rescue-detail';

/** ID ficticio del autor invitado para marcar mensajes propios en el chat mock. */
export const GUEST_MOCK_AUTHOR_ID = 99_001;

export const GUEST_MOCK_RESCUE_ID = 42;

export function buildGuestMockRescueDetail(rescueId: number): RescueCardDetail {
  return {
    id: rescueId,
    folio: `R-2026-${String(rescueId).padStart(4, '0')}`,
    service_type: 'rescue',
    client_id: 10,
    client_name: 'Transportes del Norte SA',
    service_description: 'Remolque de tractocamión varado en carretera federal',
    location_description: 'Km 45 Carretera México-Querétaro',
    sale_price: '10440.00',
    operative_status: 'pending_authorization',
    operator_id: 5,
    operator_name: 'María López',
    supplier_id: 8,
    supplier_name: 'Grúas Express',
    multiple_managers: false,
    sub_total: '9000.00',
    admin_status: 'working',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    phase_started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unlocked_until: null,
    client_type: 'CORPORATE',
    client_phone: '55 1234 5678',
    seller_id: 3,
    seller_name: 'Carlos Ruiz',
    vehicle: 'TR-8842',
    provider_cost: '4000.00',
    net_profit: '5000.00',
    supplier_score: null,
    latitude: '20.5888',
    longitude: '-100.3899',
    quote_count: 1,
  };
}

export function buildGuestMockQuoteDetail(rescueId: number): RescueQuoteDetail {
  return {
    id: 7,
    rescue_id: rescueId,
    technical_cost: '4000.00',
    sub_total: '9000.00',
    total: '10440.00',
    comissions_apply: '500.00',
    iva: 16,
    services: [
      {
        id: 1,
        service_id: 101,
        service_name: 'REMOLQUE',
        quantity: 2,
        real_cost: '3000.00',
        pre_total: '3800.00',
        percenaje_apply: '0',
        amount_applied: '200.00',
        amount_rounded: '0.00',
        total: '4000.00',
      },
      {
        id: 2,
        service_id: 102,
        service_name: 'MANIOBRAS',
        quantity: 10,
        real_cost: '1000.00',
        pre_total: '4800.00',
        percenaje_apply: '0',
        amount_applied: '200.00',
        amount_rounded: '0.00',
        total: '5000.00',
      },
    ],
  };
}

export function buildGuestMockChatMessages(): RescueChatMessage[] {
  const now = Date.now();
  return [
    {
      id: 1,
      type: 'system',
      text: 'Solicitud de rescate creada',
      created_at: new Date(now - 60 * 60 * 1000).toISOString(),
      created_by_id: null,
      created_by_name: null,
      response_to_id: null,
    },
    {
      id: 2,
      type: 'user',
      text: 'Buen día, ¿cuándo estiman llegar al punto?',
      created_at: new Date(now - 45 * 60 * 1000).toISOString(),
      created_by_id: GUEST_MOCK_AUTHOR_ID,
      created_by_name: 'Autorizador invitado',
      response_to_id: null,
    },
    {
      id: 3,
      type: 'user',
      text: 'El operador está en camino, ETA 25 minutos.',
      created_at: new Date(now - 20 * 60 * 1000).toISOString(),
      created_by_id: 5,
      created_by_name: 'María López',
      response_to_id: null,
    },
  ];
}

export function buildGuestMockEvidences(): RescueEvidence[] {
  return [
    {
      id: 1,
      type: 'service',
      url: 'https://picsum.photos/seed/rescue-evidence-1/800/600',
    },
    {
      id: 2,
      type: 'service',
      url: 'https://picsum.photos/seed/rescue-evidence-2/800/600',
    },
  ];
}

export function isGuestMockInvalidToken(token: string): boolean {
  return token.trim() === GUEST_AUTHORIZE_INVALID_TOKEN;
}
