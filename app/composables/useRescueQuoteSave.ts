import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import { RESCUE_QUOTE_CREATE_PATH } from '~/constants/rescue-quote-api';
import type { RescueQuoteCreateBody } from '~/interfaces/rescue/quote';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import type { RescueQuoteCreateResponse } from '~/interfaces/rescue/quote';
import { getRescueStepQuoteWithSettingsSchema } from '~/schemas/rescue-create';
import { buildRescueQuoteCreateBody } from '~/utils/rescue-quote-create';

export function useRescueQuoteSave(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const id = computed(() => toValue(rescueId));

  const { mutateAsync, asyncStatus } = useMutation({
    mutation: (body: RescueQuoteCreateBody) =>
      apiFetch<RescueQuoteCreateResponse>(RESCUE_QUOTE_CREATE_PATH, {
        method: 'POST',
        body,
      }),
    onSuccess: async () => {
      const currentId = id.value;
      if (currentId != null) {
        await queryCache.invalidateQueries({
          key: ['rescue-card-detail', currentId],
        });
      }
      await queryCache.invalidateQueries({
        key: ['operational-rescue-cards'],
      });
    },
    onError: (error) => {
      toast.add({
        title: 'No se pudo guardar la cotización',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
    },
  });

  const isSaving = computed(() => asyncStatus.value === 'loading');

  async function saveCreate(payload: {
    quoteLines: RescueQuoteLine[];
    companySettings: RescueCompanySettings | null;
    serviceType: RescueServiceType;
  }) {
    const currentId = id.value;
    if (currentId == null) return false;

    const schema = getRescueStepQuoteWithSettingsSchema(payload.serviceType);
    const parsed = schema.safeParse({
      quote_lines: payload.quoteLines,
      company_settings: payload.companySettings,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast.add({
        title: first?.message ?? 'Revisa la cotización',
        color: 'error',
      });
      return false;
    }

    const body = buildRescueQuoteCreateBody(
      currentId,
      parsed.data.quote_lines,
      parsed.data.company_settings,
    );
    if (body == null) {
      toast.add({
        title: 'Agrega al menos un servicio con precio',
        color: 'error',
      });
      return false;
    }

    try {
      await mutateAsync(body);
      toast.add({
        title: 'Cotización guardada',
        color: 'success',
      });
      return true;
    } catch {
      return false;
    }
  }

  return {
    saveCreate,
    isSaving,
  };
}
