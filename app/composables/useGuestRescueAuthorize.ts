import type { MaybeRefOrGetter } from 'vue';
import type { RescueChatMessage } from '~/interfaces/rescue';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import {
  buildGuestMockChatMessages,
  buildGuestMockEvidences,
  buildGuestMockQuoteDetail,
  buildGuestMockRescueDetail,
  GUEST_MOCK_AUTHOR_ID,
  isGuestMockInvalidToken,
} from '~/mocks/guest-rescue-authorize';

const GUEST_MOCK_FETCH_DELAY_MS = 300;

export interface GuestRescueAuthorizeParams {
  rescueId: number;
  token: string;
}

export interface GuestRescueAuthorizeData {
  detail: RescueCardDetail;
  quoteDetail: RescueQuoteDetail;
  chatMessages: RescueChatMessage[];
  evidences: RescueEvidence[];
  rescueId: number;
  guestAuthorId: number;
}

/**
 * Fase 1: datos mock.
 * Fase 2: GET /api/rescue/{rescueId}/authorization/{token}/
 * y endpoints anidados (messages, quote, evidences, quote/pdf).
 */
export function useGuestRescueAuthorize(
  rescueId: MaybeRefOrGetter<number | null>,
  token: MaybeRefOrGetter<string>,
) {
  const rescueIdValue = computed(() => toValue(rescueId));
  const tokenValue = computed(() => toValue(token)?.trim() ?? '');

  const detail = ref<RescueCardDetail | null>(null);
  const quoteDetail = ref<RescueQuoteDetail | null>(null);
  const chatMessages = ref<RescueChatMessage[]>([]);
  const evidences = ref<RescueEvidence[]>([]);
  const isPending = ref(true);
  const errorMessage = ref('');
  const guestAuthorId = ref(GUEST_MOCK_AUTHOR_ID);

  async function load() {
    const currentRescueId = rescueIdValue.value;
    const currentToken = tokenValue.value;

    if (currentRescueId == null || !currentToken) {
      detail.value = null;
      quoteDetail.value = null;
      chatMessages.value = [];
      evidences.value = [];
      errorMessage.value = 'Enlace no válido o expirado';
      isPending.value = false;
      return;
    }

    isPending.value = true;
    errorMessage.value = '';

    await new Promise((resolve) => {
      setTimeout(resolve, GUEST_MOCK_FETCH_DELAY_MS);
    });

    if (isGuestMockInvalidToken(currentToken)) {
      detail.value = null;
      quoteDetail.value = null;
      chatMessages.value = [];
      evidences.value = [];
      errorMessage.value = 'Enlace no válido o expirado';
      isPending.value = false;
      return;
    }

    detail.value = buildGuestMockRescueDetail(currentRescueId);
    quoteDetail.value = buildGuestMockQuoteDetail(currentRescueId);
    chatMessages.value = buildGuestMockChatMessages();
    evidences.value = buildGuestMockEvidences();
    guestAuthorId.value = GUEST_MOCK_AUTHOR_ID;
    isPending.value = false;
  }

  watch([rescueIdValue, tokenValue], () => {
    void load();
  }, { immediate: true });

  return {
    detail: computed(() => detail.value),
    quoteDetail: computed(() => quoteDetail.value),
    chatMessages,
    evidences,
    rescueId: rescueIdValue,
    guestAuthorId: computed(() => guestAuthorId.value),
    isPending: computed(() => isPending.value),
    errorMessage: computed(() => errorMessage.value),
    refresh: load,
  };
}
