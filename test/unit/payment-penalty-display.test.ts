import { describe, expect, it } from 'vitest';
import {
  formatPenaltyPercent,
  renderOperativePenaltyAmount,
} from '../../app/utils/payment-penalty-display';
import { formatRescueCardMoney } from '../../app/utils/operational-rescue-card';

describe('payment-penalty-display', () => {
  it('formatPenaltyPercent handles fraction and whole percent values', () => {
    expect(formatPenaltyPercent('0.25')).toBe('25%');
    expect(formatPenaltyPercent('25')).toBe('25%');
    expect(formatPenaltyPercent('0')).toBe('—');
  });

  it('renderOperativePenaltyAmount shows single amount without penalty', () => {
    const vnode = renderOperativePenaltyAmount(
      { amount: '100.00', is_penalty: false },
      false,
    );
    expect(vnode.children).toBe(formatRescueCardMoney('100.00'));
  });

  it('renderOperativePenaltyAmount shows strikethrough and penalty_amount when penalized', () => {
    const vnode = renderOperativePenaltyAmount(
      {
        amount: '270.00',
        is_penalty: true,
        penalty_amount: '200.00',
      },
      false,
    );
    expect(vnode.type).toBe('div');
    expect(Array.isArray(vnode.children)).toBe(true);
  });

  it('renderOperativePenaltyAmount shows full amount when penalty is forgiven', () => {
    const vnode = renderOperativePenaltyAmount(
      {
        amount: '270.00',
        is_penalty: true,
        penalty_amount: '200.00',
      },
      true,
    );
    expect(vnode.children).toBe(formatRescueCardMoney('270.00'));
  });
});
