import { FILL_OC_MOCK_KEY, type FillOcMockKey } from '~/constants/fill-oc-api';
import type {
  FillOcListResult,
  FillOcPendingItem,
} from '~/interfaces/nexxt-step/fill-oc';

export const FILL_OC_MOCK_ITEMS: FillOcPendingItem[] = [
  {
    id: 12,
    folio: 'RES-2026-00012',
    total: '3450.00',
    unattended_at: '2026-08-10T14:32:07.123456Z',
  },
  {
    id: 15,
    folio: 'RES-2026-00015',
    total: '1200.50',
    unattended_at: '2026-08-11T09:05:41.000000Z',
  },
  {
    id: 18,
    folio: 'RES-2026-00018',
    total: '8900.00',
    unattended_at: '2026-08-12T21:15:00.000000Z',
  },
];

const MOCK_KEYS = new Set<string>(Object.values(FILL_OC_MOCK_KEY));

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

export function delayFillOcMock(ms = 280): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
