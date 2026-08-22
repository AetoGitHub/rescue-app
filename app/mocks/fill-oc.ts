import { FILL_OC_MOCK_KEY, type FillOcMockKey } from '~/constants/fill-oc-api';
import type {
  FillOcListResult,
  FillOcPendingItem,
  FillOcStaffToken,
} from '~/interfaces/nexxt-step/fill-oc';
import type { RescueChatMessage } from '~/interfaces/rescue';
import type { PaginatedResponse } from '~/interfaces/shared/pagination.interface';

export const FILL_OC_MOCK_ITEMS: FillOcPendingItem[] = [
  {
    id: 12,
    folio: 'RES-2026-00012',
    responsable: 'TEST TEST',
    vehicle: 'Unidad 12',
    service_description: 'Cambio de llanta en carretera',
    unattended_at: '2026-08-10T14:32:07.123456Z',
    sub_total: 2974.14,
    iva: 475.86,
    total: '3450.00',
  },
  {
    id: 15,
    folio: 'RES-2026-00015',
    responsable: 'Ana López',
    vehicle: 'ABC-15-XZ',
    service_description: 'Grúa local',
    unattended_at: '2026-08-11T09:05:41.000000Z',
    sub_total: 1034.91,
    iva: 165.59,
    total: '1200.50',
  },
  {
    id: 18,
    folio: 'RES-2026-00018',
    responsable: 'TEST TEST',
    vehicle: 'x',
    service_description: '',
    unattended_at: '2026-08-12T21:15:00.000000Z',
    sub_total: 7672.41,
    iva: 1227.59,
    total: '8900.00',
  },
];

export const FILL_OC_MOCK_STAFF_TOKEN: FillOcStaffToken = {
  token: 'mock-fill-oc-staff-token',
  userId: 9001,
};

const MOCK_KEYS = new Set<string>(Object.values(FILL_OC_MOCK_KEY));

const mockChatByRescueId = new Map<number, RescueChatMessage[]>();

export function isFillOcMockKey(key: string): key is FillOcMockKey {
  return import.meta.dev && MOCK_KEYS.has(key);
}

export function getFillOcMockListResult(key: string): FillOcListResult {
  if (key === FILL_OC_MOCK_KEY.unauthorized) {
    return {
      items: [],
      errorStatus: 401,
      errorMessage: 'Unauthorized',
    };
  }

  if (key === FILL_OC_MOCK_KEY.error) {
    return {
      items: [],
      errorStatus: 500,
      errorMessage: 'El servicio no está disponible. Intenta más tarde.',
    };
  }

  if (key === FILL_OC_MOCK_KEY.empty) {
    return { items: [], errorStatus: null, errorMessage: '' };
  }

  return {
    items: FILL_OC_MOCK_ITEMS.map((item) => ({ ...item })),
    errorStatus: null,
    errorMessage: '',
  };
}

export function getFillOcMockStaffToken(): FillOcStaffToken {
  return { ...FILL_OC_MOCK_STAFF_TOKEN };
}

export function getFillOcMockChatPage(
  rescueId: number,
): PaginatedResponse<RescueChatMessage> {
  return {
    next: null,
    previous: null,
    results: [...(mockChatByRescueId.get(rescueId) ?? [])],
  };
}

export function appendFillOcMockChatMessage(
  rescueId: number,
  text: string,
): RescueChatMessage {
  const message: RescueChatMessage = {
    id: Date.now(),
    type: 'user',
    text,
    created_at: new Date().toISOString(),
    created_by_id: FILL_OC_MOCK_STAFF_TOKEN.userId,
    created_by_name: 'OC',
    response_to_id: null,
  };

  const current = mockChatByRescueId.get(rescueId) ?? [];
  mockChatByRescueId.set(rescueId, [...current, message]);
  return message;
}

export function delayFillOcMock(ms = 280): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
