import type { MaybeRefOrGetter } from 'vue';
import type { RescueChatMessage } from '~/interfaces/rescue';
import type { RescueCardDetail } from '~/interfaces/rescue/detail';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';
import type { RescueQuoteDetail } from '~/interfaces/rescue/quote';
import {
  RESCUE_GUEST_CARD_DETAIL_PATH,
  RESCUE_GUEST_EVIDENCE_LIST_PATH,
  RESCUE_GUEST_QUOTE_DETAIL_PATH,
} from '~/constants/rescue-approve-link-api';
import {
  buildGuestMockChatMessages,
  buildGuestMockEvidences,
  buildGuestMockQuoteDetail,
  buildGuestMockRescueDetail,
  GUEST_MOCK_AUTHOR_ID,
  isGuestMockInvalidToken,
} from '~/mocks/guest-rescue-authorize';
import { mapGuestRescueDetailFromApproveApi } from '~/utils/rescue-guest-detail-map';
import { isRescueQuoteNotFoundError } from '~/utils/rescue-quote-not-found';

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
  const isQuotePending = ref(false);
  const errorMessage = ref('');
  const quoteErrorMessage = ref('');

  async function loadGuestQuote(
    currentRescueId: number,
    currentToken: string,
  ) {
    isQuotePending.value = true;
    quoteErrorMessage.value = '';

    try {
      quoteDetail.value = await guestApiFetch<RescueQuoteDetail>(
        RESCUE_GUEST_QUOTE_DETAIL_PATH(currentRescueId, currentToken),
      );
    } catch (error) {
      if (isRescueQuoteNotFoundError(error)) {
        quoteDetail.value = null;
        return;
      }
      quoteDetail.value = null;
      quoteErrorMessage.value = getFetchErrorMessage(error);
    } finally {
      isQuotePending.value = false;
    }
  }

  async function loadGuestEvidences(
    currentRescueId: number,
    currentToken: string,
  ) {
    try {
      const raw = await guestApiFetch<unknown>(
        RESCUE_GUEST_EVIDENCE_LIST_PATH(currentRescueId, currentToken),
      );
      evidences.value = mapRescueEvidenceListFromApi(raw);
    } catch {
      evidences.value = [];
    }
  }

  async function loadFromApi(currentRescueId: number, currentToken: string) {
    const raw = await guestApiFetch<unknown>(
      RESCUE_GUEST_CARD_DETAIL_PATH(currentRescueId, currentToken),
    );
    detail.value = mapGuestRescueDetailFromApproveApi(raw);

    await Promise.all([
      loadGuestQuote(currentRescueId, currentToken),
      loadGuestEvidences(currentRescueId, currentToken),
    ]);
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
      quoteErrorMessage.value = '';
      isPending.value = false;
      isQuotePending.value = false;
      return;
    }

    isPending.value = true;
    errorMessage.value = '';
    quoteErrorMessage.value = '';

    try {
      if (useMock.value || isGuestMockInvalidToken(currentToken)) {
        if (isGuestMockInvalidToken(currentToken)) {
          throw new Error('Enlace no válido o expirado');
        }
        detail.value = buildGuestMockRescueDetail(currentRescueId);
        quoteDetail.value = buildGuestMockQuoteDetail(currentRescueId);
        chatMessages.value = buildGuestMockChatMessages();
        evidences.value = buildGuestMockEvidences();
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
    useMock,
    mockGuestAuthorId: GUEST_MOCK_AUTHOR_ID,
    isPending: computed(() => isPending.value),
    isQuotePending: computed(() => isQuotePending.value),
    errorMessage: computed(() => errorMessage.value),
    quoteErrorMessage: computed(() => quoteErrorMessage.value),
    refresh: load,
  };
}
