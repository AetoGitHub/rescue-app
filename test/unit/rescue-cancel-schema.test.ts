import { describe, expect, it } from 'vitest';
import {
  rescueCancelServiceSchema,
  rescueRevertCancellationSchema,
} from '~/schemas/rescue-operative';

describe('rescueCancelServiceSchema', () => {
  it('accepts a positive cancellation reason id', () => {
    const parsed = rescueCancelServiceSchema.safeParse({
      cancellation_reason: 1,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects null cancellation reason', () => {
    const parsed = rescueCancelServiceSchema.safeParse({
      cancellation_reason: null,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects zero or negative ids', () => {
    expect(
      rescueCancelServiceSchema.safeParse({ cancellation_reason: 0 }).success,
    ).toBe(false);
    expect(
      rescueCancelServiceSchema.safeParse({ cancellation_reason: -1 }).success,
    ).toBe(false);
  });
});

describe('rescueRevertCancellationSchema', () => {
  it('accepts a positive reacceptance reason id', () => {
    const parsed = rescueRevertCancellationSchema.safeParse({
      reacceptance_reason: 3,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects missing reacceptance reason', () => {
    const parsed = rescueRevertCancellationSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});
