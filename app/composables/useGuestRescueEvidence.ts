import type { MaybeRefOrGetter } from 'vue';
import type { RescueEvidence } from '~/interfaces/rescue/evidence';
import { RESCUE_GUEST_EVIDENCE_LIST_PATH } from '~/constants/rescue-approve-link-api';

export function useGuestRescueEvidence(
  rescueId: MaybeRefOrGetter<number | null>,
  apiKey: MaybeRefOrGetter<string>,
) {
  const rescueIdValue = computed(() => toValue(rescueId));
  const apiKeyValue = computed(() => toValue(apiKey)?.trim() ?? '');

  const evidences = ref<RescueEvidence[]>([]);
  const isPending = ref(true);
  const errorMessage = ref('');

  async function load() {
    const id = rescueIdValue.value;
    const key = apiKeyValue.value;

    if (id == null || !key) {
      evidences.value = [];
      errorMessage.value = 'Enlace no válido o expirado';
      isPending.value = false;
      return;
    }

    isPending.value = true;
    errorMessage.value = '';

    try {
      const raw = await guestApiFetch<unknown>(
        RESCUE_GUEST_EVIDENCE_LIST_PATH(id, key),
      );
      evidences.value = mapRescueEvidenceListFromApi(raw);
    } catch (error) {
      evidences.value = [];
      errorMessage.value = getFetchErrorMessage(error) || 'Enlace no válido o expirado';
    } finally {
      isPending.value = false;
    }
  }

  watch([rescueIdValue, apiKeyValue], () => {
    void load();
  }, { immediate: true });

  return {
    evidences,
    isPending: computed(() => isPending.value),
    errorMessage: computed(() => errorMessage.value),
    refresh: load,
  };
}
