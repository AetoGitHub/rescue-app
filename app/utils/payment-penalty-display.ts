import { h, type VNode } from 'vue';
import {
  formatRescueCardMoney,
  parseRescueCardMoney,
} from '~/utils/operational-rescue-card';

export interface OperativePenaltyDisplayItem {
  amount: string;
  is_penalty: boolean;
  penalty_applied?: string;
  penalty_amount?: string;
}

export function formatPenaltyPercent(
  value: string | null | undefined,
): string {
  const parsed = parseRescueCardMoney(value);
  if (parsed === 0) return '—';
  const percent = parsed <= 1 ? parsed * 100 : parsed;
  return `${percent.toFixed(0)}%`;
}

export function renderOperativePenaltyAmount(
  item: OperativePenaltyDisplayItem,
  forgiven: boolean,
): VNode {
  if (!item.is_penalty || forgiven) {
    return h(
      'span',
      { class: 'tabular-nums' },
      formatRescueCardMoney(item.amount),
    );
  }

  return h('div', { class: 'flex flex-col items-start gap-0.5' }, [
    h(
      'span',
      { class: 'tabular-nums text-sm text-error line-through' },
      formatRescueCardMoney(item.amount),
    ),
    h(
      'span',
      { class: 'tabular-nums font-medium' },
      formatRescueCardMoney(item.penalty_amount),
    ),
  ]);
}

export function renderOperativePenaltyStatus(
  item: OperativePenaltyDisplayItem,
  UIcon: Parameters<typeof h>[0],
): VNode {
  if (!item.is_penalty) {
    return h('div', { class: 'flex items-center gap-2' }, [
      h(UIcon, {
        name: 'i-lucide-check',
        class: 'size-4 text-success shrink-0',
      }),
      h('span', { class: 'text-sm text-muted' }, 'No'),
    ]);
  }

  return h('div', { class: 'flex flex-col gap-0.5' }, [
    h('div', { class: 'flex items-center gap-2' }, [
      h(UIcon, {
        name: 'i-lucide-x',
        class: 'size-4 text-error shrink-0',
      }),
      h('span', { class: 'text-sm font-medium text-error' }, 'Sí'),
    ]),
    h(
      'span',
      { class: 'text-xs tabular-nums text-muted' },
      formatPenaltyPercent(item.penalty_applied),
    ),
  ]);
}
