import type { RescueQuoteLine } from '~/interfaces/rescue';
import type {
  QuoteBlameField,
  QuoteLineBlameDataRaw,
} from '~/interfaces/rescue/quote';
import {
  quoteAppliedFromClientPrice,
  quoteClientPriceFromApplied,
  roundQuoteMoney,
} from '~/utils/quote-pricing';

export interface QuoteBlameUser {
  id: number;
  name: string;
}

function formatBlameOriginal(value: number): string {
  return roundQuoteMoney(value).toFixed(2);
}

export function captureQuoteBlameField(
  existing: QuoteBlameField | null,
  original: number,
  user: QuoteBlameUser | null | undefined,
): QuoteBlameField {
  if (existing != null) return existing;
  return {
    original: formatBlameOriginal(original),
    user_id: user?.id ?? 0,
    username: user?.name ?? '',
  };
}

export function parseQuoteBlameField(raw: unknown): QuoteBlameField | null {
  if (raw == null || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const original = typeof record.original === 'string' ? record.original : '';
  const user_id = Number(record.user_id);
  const username =
    typeof record.username === 'string'
      ? record.username
      : typeof record.user_name === 'string'
        ? record.user_name
        : '';
  if (original.length === 0 || !Number.isFinite(user_id)) return null;
  return { original, user_id, username };
}

export function buildQuoteLineBlameDataRaw(
  line: Pick<RescueQuoteLine, 'blame_client_price' | 'blame_applied_price'>,
): QuoteLineBlameDataRaw | undefined {
  const data: QuoteLineBlameDataRaw = {};
  if (line.blame_client_price != null) {
    data.client_price = line.blame_client_price;
  }
  if (line.blame_applied_price != null) {
    data.applied_price = line.blame_applied_price;
  }
  return Object.keys(data).length > 0 ? data : undefined;
}

export function parseQuoteLineBlameDataRaw(raw: unknown): {
  blame_client_price: QuoteBlameField | null;
  blame_applied_price: QuoteBlameField | null;
  priceOverrideSource: RescueQuoteLine['priceOverrideSource'];
} {
  if (raw == null || typeof raw !== 'object') {
    return {
      blame_client_price: null,
      blame_applied_price: null,
      priceOverrideSource: 'none',
    };
  }
  const record = raw as Record<string, unknown>;
  const blame_client_price = parseQuoteBlameField(record.client_price);
  const blame_applied_price = parseQuoteBlameField(record.applied_price);
  const priceOverrideSource: RescueQuoteLine['priceOverrideSource'] =
    blame_applied_price != null
      ? 'applied_price'
      : blame_client_price != null
        ? 'client_price'
        : 'none';
  return {
    blame_client_price,
    blame_applied_price,
    priceOverrideSource,
  };
}

export function applyClientPriceOverride(
  line: RescueQuoteLine,
  value: number,
  initializer: number,
  user: QuoteBlameUser | null | undefined,
): void {
  line.client_price = value;
  line.priceOverrideSource = 'client_price';
  line.blame_client_price = captureQuoteBlameField(
    line.blame_client_price,
    initializer,
    user,
  );
  line.applied_price = quoteAppliedFromClientPrice(value, line.quantity);
}

export function applyAppliedPriceOverride(
  line: RescueQuoteLine,
  value: number,
  calculatedApplied: number,
  user: QuoteBlameUser | null | undefined,
): void {
  line.applied_price = value;
  line.priceOverrideSource = 'applied_price';
  line.blame_applied_price = captureQuoteBlameField(
    line.blame_applied_price,
    calculatedApplied,
    user,
  );
  line.client_price = quoteClientPriceFromApplied(value, line.quantity);
}

export function resetQuoteLinePriceOverrides(
  line: RescueQuoteLine,
  calculatedApplied: number,
  clientPriceInitializer: number,
): void {
  line.priceOverrideSource = 'none';
  line.blame_client_price = null;
  line.blame_applied_price = null;
  line.applied_price = calculatedApplied;
  line.client_price = clientPriceInitializer;
}

function inferOverrideSourceFromBlame(
  line: RescueQuoteLine,
): RescueQuoteLine['priceOverrideSource'] {
  if (line.priceOverrideSource !== 'none') return line.priceOverrideSource;
  if (line.blame_applied_price != null) return 'applied_price';
  if (line.blame_client_price != null) return 'client_price';
  return 'none';
}

export function syncQuoteLinePricesFromCalculated(
  line: RescueQuoteLine,
  calculatedApplied: number,
  clientPriceInitializer: number,
  previousCalculatedApplied: number | undefined,
): void {
  if (previousCalculatedApplied == null) {
    line.priceOverrideSource = inferOverrideSourceFromBlame(line);

    if (line.priceOverrideSource === 'client_price') {
      line.applied_price = quoteAppliedFromClientPrice(
        line.client_price,
        line.quantity,
      );
      return;
    }

    if (line.priceOverrideSource === 'applied_price') {
      if (!(line.client_price > 0)) {
        line.client_price = quoteClientPriceFromApplied(
          line.applied_price,
          line.quantity,
        );
      }
      return;
    }

    if (!(line.applied_price > 0)) {
      line.applied_price = calculatedApplied;
    }
    if (!(line.client_price > 0)) {
      line.client_price = clientPriceInitializer;
    }

    const appliedCustom =
      line.applied_price > 0
      && roundQuoteMoney(line.applied_price)
        !== roundQuoteMoney(calculatedApplied);
    const clientCustom =
      line.client_price > 0
      && roundQuoteMoney(line.client_price)
        !== roundQuoteMoney(clientPriceInitializer);

    if (appliedCustom) {
      line.priceOverrideSource = 'applied_price';
      line.client_price = quoteClientPriceFromApplied(
        line.applied_price,
        line.quantity,
      );
    } else if (clientCustom) {
      line.priceOverrideSource = 'client_price';
      line.applied_price = quoteAppliedFromClientPrice(
        line.client_price,
        line.quantity,
      );
    }
    return;
  }

  if (line.priceOverrideSource === 'client_price') {
    line.applied_price = quoteAppliedFromClientPrice(
      line.client_price,
      line.quantity,
    );
    return;
  }

  if (line.priceOverrideSource === 'applied_price') {
    line.client_price = quoteClientPriceFromApplied(
      line.applied_price,
      line.quantity,
    );
    return;
  }

  if (
    roundQuoteMoney(line.applied_price)
    === roundQuoteMoney(previousCalculatedApplied)
  ) {
    line.applied_price = calculatedApplied;
  }
  line.client_price = clientPriceInitializer;
}
