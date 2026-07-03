import type { MaybeRefOrGetter } from 'vue';
import type { RescueChatMessage } from '~/interfaces/rescue';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import { RESCUE_GUEST_CARD_DETAIL_PATH } from '~/constants/rescue-approve-link-api';
import {
  buildGuestMockChatMessages,
  buildGuestMockEvidences,
  buildGuestMockQuoteDetail,
  buildGuestMockRescueDetail,
  GUEST_MOCK_AUTHOR_ID,
  isGuestMockInvalidToken,
} from '~/mocks/guest-rescue-authorize';
import { mapGuestRescueDetailFromApproveApi } from '~/utils/rescue-guest-detail-map';

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

function loadGuestMockData(rescueId: number) {
  return {
    detail: buildGuestMockRescueDetail(rescueId),
    quoteDetail: buildGuestMockQuoteDetail(rescueId),
    chatMessages: buildGuestMockChatMessages(),
    evidences: buildGuestMockEvidences(),
    guestAuthorId: GUEST_MOCK_AUTHOR_ID,
  };
}

export function useGuestRescueAuthorize(
  rescueId: MaybeRefOrGetter<number | null>,
  token: MaybeRefOrGetter<string>,
) {
  const runtimeConfig = useRuntimeConfig();
  const rescueIdValue = computed(() => toValue(rescueId));
  const tokenValue = computed(() => toValue(token)?.trim() ?? '');

  const useMock = computed(
    () => Boolean(runtimeConfig.public.guestRescueUseMock),
  );

  const detail = ref<RescueCardDetail | null>(null);
  const quoteDetail = ref<RescueQuoteDetail | null>(null);
  const chatMessages = ref<RescueChatMessage[]>([]);
  const evidences = ref<RescueEvidence[]>([]);
  const isPending = ref(true);
  const errorMessage = ref('');
  const guestAuthorId = ref(GUEST_MOCK_AUTHOR_ID);

  async function loadFromApi(currentRescueId: number, currentToken: string) {
    const raw = await guestApiFetch<unknown>(
      RESCUE_GUEST_CARD_DETAIL_PATH(currentRescueId, currentToken),
    );
    detail.value = mapGuestRescueDetailFromApproveApi(raw);
    quoteDetail.value = buildGuestMockQuoteDetail(currentRescueId);
    chatMessages.value = buildGuestMockChatMessages();
    evidences.value = buildGuestMockEvidences();
    guestAuthorId.value = GUEST_MOCK_AUTHOR_ID;
  }

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

    try {
      if (useMock.value || isGuestMockInvalidToken(currentToken)) {
        if (isGuestMockInvalidToken(currentToken)) {
          throw new Error('Enlace no válido o expirado');
        }
        const mock = loadGuestMockData(currentRescueId);
        detail.value = mock.detail;
        quoteDetail.value = mock.quoteDetail;
        chatMessages.value = mock.chatMessages;
        evidences.value = mock.evidences;
        guestAuthorId.value = mock.guestAuthorId;
        return;
      }

      await loadFromApi(currentRescueId, currentToken);
    } catch (error) {
      detail.value = null;
      quoteDetail.value = null;
      chatMessages.value = [];
      evidences.value = [];
      errorMessage.value = getFetchErrorMessage(error) || 'Enlace no válido o expirado';
    } finally {
      isPending.value = false;
    }
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
