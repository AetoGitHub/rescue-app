import { describe, expect, it, vi } from 'vitest';
import type { RescueQuoteLine } from '~/interfaces/rescue';
import { catalogDropdownSelection } from '~/interfaces/shared/catalog-dropdown.interface';
import { assertClientCreditForQuote } from '~/utils/credit-check';

function filledLine(): RescueQuoteLine {
  return {
    id: 'line-1',
    service: catalogDropdownSelection(1, 'Servicio'),
    quantity: 1,
    unit_cost: 1000,
    contract_item_id: null,
    applied_price: 0,
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
});
