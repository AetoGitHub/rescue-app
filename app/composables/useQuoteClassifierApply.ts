import { QUOTE_CLASSIFY_PATH } from '~/constants/quote-classifier-api';
import type {
  QuoteClassifierApplyPayload,
  QuoteClassifierInputType,
  QuoteClassifierResponse,
} from '~/interfaces/rescue/quote-classifier';

export function useQuoteClassifierApply(options: {
  onApplyLines: (payload: QuoteClassifierApplyPayload) => void;
}) {
  const apiFetch = useApiFetch();
  const toast = useToast();

  const isBusy = ref(false);
  const lastNotes = ref<string[]>([]);
  const lastNotesHasUnmatched = ref(false);

  async function classifyInput(input: string, type: QuoteClassifierInputType) {
    isBusy.value = true;
    lastNotes.value = [];
    lastNotesHasUnmatched.value = false;

    try {
      const response = await apiFetch<QuoteClassifierResponse>(QUOTE_CLASSIFY_PATH, {
        method: 'POST',
        body: { input, type },
      });

      const lines = mapClassifierResponseToQuoteLines(response);
      const notes = normalizeClassifierNotes(response);
      lastNotes.value = notes;
      lastNotesHasUnmatched.value = classifierResponseHasUnmatchedLines(response);

      options.onApplyLines({ lines, notes });

      toast.add({
        title: 'Renglones generados',
        description:
          lines.length === 1
            ? 'Se agregó 1 renglón a la cotización.'
            : `Se agregaron ${lines.length} renglones a la cotización.`,
        color: 'success',
      });
    } catch (error) {
      toast.add({
        title: 'No se pudo clasificar la solicitud',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    } finally {
      isBusy.value = false;
    }
  }

  return {
    isBusy,
    lastNotes,
    lastNotesHasUnmatched,
    classifyInput,
  };
}
