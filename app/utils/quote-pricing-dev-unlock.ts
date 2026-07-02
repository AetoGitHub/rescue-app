export const QUOTE_PRICING_DEV_UNLOCK_STORAGE_KEY = 'quote-pricing-dev-unlocked';

export type QuoteDevUnlockKeyEvent = Pick<
  KeyboardEvent,
  'ctrlKey' | 'shiftKey' | 'key'
> & {
  preventDefault?: () => void;
};

export function readQuoteDevUnlockFromStorage(raw: string | null): boolean {
  return raw === '1';
}

export function writeQuoteDevUnlockToStorage(unlocked: boolean): void {
  if (!import.meta.client) return;

  if (unlocked) {
    sessionStorage.setItem(QUOTE_PRICING_DEV_UNLOCK_STORAGE_KEY, '1');
    return;
  }

  sessionStorage.removeItem(QUOTE_PRICING_DEV_UNLOCK_STORAGE_KEY);
}

export function readQuoteDevUnlockFromSessionStorage(): boolean {
  if (!import.meta.client) return false;
  return readQuoteDevUnlockFromStorage(
    sessionStorage.getItem(QUOTE_PRICING_DEV_UNLOCK_STORAGE_KEY),
  );
}

export function shouldShowQuotePricingDevBreakdown(options: {
  dev: boolean;
  unlocked: boolean;
  isAdmin: boolean;
}): boolean {
  if (options.dev) return true;
  return options.unlocked && options.isAdmin;
}

export function canToggleQuotePricingDevUnlock(options: {
  dev: boolean;
  isAdmin: boolean;
}): boolean {
  return options.dev || options.isAdmin;
}

export function isQuoteDevUnlockShortcut(event: QuoteDevUnlockKeyEvent): boolean {
  return (
    event.ctrlKey === true
    && event.shiftKey === true
    && event.key.toLowerCase() === 'q'
  );
}

export type QuotePricingDevBreakdownMode = 'dev' | 'admin';

export function quotePricingDevBreakdownMode(options: {
  dev: boolean;
  unlocked: boolean;
  isAdmin: boolean;
}): QuotePricingDevBreakdownMode | null {
  if (!shouldShowQuotePricingDevBreakdown(options)) return null;
  if (options.dev) return 'dev';
  return 'admin';
}
