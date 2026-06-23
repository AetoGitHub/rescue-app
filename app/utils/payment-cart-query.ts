import { parsePositiveIntQuery } from '#shared/utils/payment-balance-query';

export interface PaymentCartQueryInput {
  testDays?: number | null;
  dev?: boolean;
}

export function buildPaymentCartQuery(
  input: PaymentCartQueryInput = {},
): Record<string, string> {
  const query: Record<string, string> = {};
  const dev = input.dev ?? import.meta.dev;

  if (dev && input.testDays != null) {
    const testDays = parsePositiveIntQuery(input.testDays);
    if (testDays != null) {
      query.test_days = String(testDays);
    }
  }

  return query;
}
