import { describe, expect, it, vi } from 'vitest';
import { SESSION_EXPIRED_MESSAGE } from '#shared/constants/session';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import { catalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import {
  assertClientCreditForQuote,
  CREDIT_CHECK_UNAVAILABLE_TITLE,
  CREDIT_INSUFFICIENT_TITLE,
} from '~/utils/credit-check';
import { emptyQuoteLinePriceFields } from '~/utils/rescue-quote-lines';

function filledLine(): RescueQuoteLine {
  return {
    id: 'line-1',
    service: catalogDropdownSelection(1, 'Servicio'),
    quantity: 1,
    unit_cost: 1000,
    contract_item_id: null,
    ...emptyQuoteLinePriceFields(),
  };
}

describe('assertClientCreditForQuote', () => {
  it('skips check when there are no quote lines', async () => {
    const fetcher = vi.fn();
    const result = await assertClientCreditForQuote(fetcher, 1, [], null);
    expect(result).toEqual({ ok: true });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('blocks when API returns status false', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      status: false,
      message:
        'Crédito insuficiente. Disponible: $2,000.00 | Requerido: $3,500.00 | Excede por: $1,500.00',
    });

    const result = await assertClientCreditForQuote(
      fetcher,
      1,
      [filledLine()],
      null,
    );

    expect(result).toEqual({
      ok: false,
      kind: 'insufficient',
      title: CREDIT_INSUFFICIENT_TITLE,
      message:
        'Crédito insuficiente. Disponible: $2,000.00 | Requerido: $3,500.00 | Excede por: $1,500.00',
    });
    expect(fetcher).toHaveBeenCalledWith(
      '/api/credit/check/',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          client: 1,
          amount: expect.any(String),
        }),
      }),
    );
  });

  it('allows when API returns status true', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      status: true,
      message: 'Crédito suficiente. Disponible: $5,000.00 | Requerido: $3,500.00 | Restante tras operación: $1,500.00',
    });

    const result = await assertClientCreditForQuote(
      fetcher,
      1,
      [filledLine()],
      null,
    );

    expect(result).toEqual({ ok: true });
  });

  it('does not treat a 401 as insufficient credit', async () => {
    const fetcher = vi.fn().mockRejectedValue({
      statusCode: 401,
      message: '[POST] "/api/credit/check/": 401 Unauthorized',
      statusMessage: 'Unauthorized',
    });

    const result = await assertClientCreditForQuote(
      fetcher,
      1,
      [filledLine()],
      null,
    );

    expect(result).toEqual({
      ok: false,
      kind: 'session',
      title: SESSION_EXPIRED_MESSAGE,
      message: SESSION_EXPIRED_MESSAGE,
    });
  });

  it('treats other HTTP failures as credit check unavailable', async () => {
    const fetcher = vi.fn().mockRejectedValue({
      statusCode: 502,
      message: '[POST] "/api/credit/check/": 502 Bad Gateway',
      statusMessage: 'Bad Gateway',
    });

    const result = await assertClientCreditForQuote(
      fetcher,
      1,
      [filledLine()],
      null,
    );

    expect(result).toEqual({
      ok: false,
      kind: 'unavailable',
      title: CREDIT_CHECK_UNAVAILABLE_TITLE,
      message: 'No se pudo completar la operación.',
    });
  });
});
