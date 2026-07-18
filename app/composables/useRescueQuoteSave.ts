import { useMutation, useQueryCache } from '@pinia/colada';
import type { MaybeRefOrGetter } from 'vue';
import {
  RESCUE_QUOTE_CREATE_PATH,
  RESCUE_QUOTE_UPDATE_PATH,
} from '~/constants/rescue-quote-api';
import type {
  RescueQuoteCreateBody,
  RescueQuoteCreateResponse,
  RescueQuoteUpdateBody,
} from '~/interfaces/rescue/quote';
import type { RescueQuoteLine, RescueServiceType } from '~/interfaces/rescue';
import type { RescueCompanySettings } from '~/interfaces/rescue/company-settings';
import { getRescueStepQuoteWithSettingsSchema } from '~/schemas/rescue-create';
import {
  buildRescueQuoteCreateBody,
  buildRescueQuoteUpdateBody,
} from '~/utils/rescue-quote-create';
import { isRescueQuoteNotFoundError } from '~/utils/rescue-quote-not-found';

type QuoteSaveBasePayload = {
  quoteLines: RescueQuoteLine[];
  companySettings: RescueCompanySettings | null;
  serviceType: RescueServiceType;
  clientSellerId?: number | null;
};

type QuoteSaveCreatePayload = QuoteSaveBasePayload & {
  clientId: number;
};

export function useRescueQuoteSave(
  rescueId: MaybeRefOrGetter<number | null>,
) {
  const apiFetch = useApiFetch();
  const queryCache = useQueryCache();
  const toast = useToast();
  const { assertClientCreditForQuote } = useCreditCheck();
  const id = computed(() => toValue(rescueId));

  async function invalidateQuoteQueries() {
    const currentId = id.value;
    if (currentId != null) {
      await queryCache.invalidateQueries({
        key: ['rescue-card-detail', currentId],
      });
      await queryCache.invalidateQueries({
        key: ['rescue-quote-detail', currentId],
      });
    }
    await queryCache.invalidateQueries({
      key: ['operational-rescue-cards'],
    });
    await queryCache.invalidateQueries({
      key: ['operational-rescue-list'],
    });
    await queryCache.invalidateQueries({
      key: ['operational-rescue-cards-summary'],
    });
  }

  const { mutateAsync: createQuote, asyncStatus: createStatus } = useMutation({
    mutation: (body: RescueQuoteCreateBody) =>
      apiFetch<RescueQuoteCreateResponse>(RESCUE_QUOTE_CREATE_PATH, {
        method: 'POST',
        body,
      }),
    onSuccess: invalidateQuoteQueries,
  });

  const { mutateAsync: updateQuote, asyncStatus: updateStatus } = useMutation({
    mutation: (body: RescueQuoteUpdateBody) =>
      apiFetch<RescueQuoteCreateResponse>(
        RESCUE_QUOTE_UPDATE_PATH(id.value as number),
        {
          method: 'PUT',
          body,
        },
      ),
    onSuccess: invalidateQuoteQueries,
  });

  const isSaving = computed(
    () => createStatus.value === 'loading' || updateStatus.value === 'loading',
  );

  function validateQuotePayload(payload: QuoteSaveBasePayload) {
    const currentId = id.value;
    if (currentId == null) return null;

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
      return null;
    }

    return { currentId, parsed: parsed.data };
  }

  async function saveCreate(payload: QuoteSaveCreatePayload) {
    const validated = validateQuotePayload(payload);
    if (validated == null) return false;

    const body = buildRescueQuoteCreateBody(
      validated.currentId,
      validated.parsed.quote_lines,
      validated.parsed.company_settings,
      {
        clientSellerId: payload.clientSellerId,
        serviceType: payload.serviceType,
      },
    );
    if (body == null) {
      toast.add({
        title: 'Agrega al menos un servicio con precio',
        color: 'error',
      });
      return false;
    }

    const creditGate = await assertClientCreditForQuote(
      payload.clientId,
      validated.parsed.quote_lines,
      validated.parsed.company_settings,
      payload.clientSellerId,
      payload.serviceType,
    );
    if (!creditGate.ok) {
      toast.add({
        title: 'Crédito insuficiente',
        description: creditGate.message,
        color: 'error',
      });
      return false;
    }

    try {
      await createQuote(body);
      toast.add({
        title: 'Cotización guardada',
        color: 'success',
      });
      return true;
    } catch (error) {
      if (isRescueQuoteNotFoundError(error)) {
        return saveUpdate(payload);
      }
      toast.add({
        title: 'No se pudo guardar la cotización',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    }
  }

  async function saveUpdate(payload: QuoteSaveBasePayload) {
    const validated = validateQuotePayload(payload);
    if (validated == null) return false;

    const body = buildRescueQuoteUpdateBody(
      validated.parsed.quote_lines,
      validated.parsed.company_settings,
      {
        clientSellerId: payload.clientSellerId,
        serviceType: payload.serviceType,
      },
    );
    if (body == null) {
      toast.add({
        title: 'Agrega al menos un servicio con precio',
        color: 'error',
      });
      return false;
    }

    try {
      await updateQuote(body);
      toast.add({
        title: 'Cotización actualizada',
        color: 'success',
      });
      return true;
    } catch (error) {
      toast.add({
        title: 'No se pudo actualizar la cotización',
        description: getFetchErrorMessage(error),
        color: 'error',
      });
      return false;
    }
  }

  return {
    saveCreate,
    saveUpdate,
    isSaving,
  };
}
