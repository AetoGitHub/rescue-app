import type { QuoteEditorTabValue } from '~/interfaces/rescue/quote-classifier';

export const QUOTE_EDITOR_TAB_ITEMS = [
  {
    label: 'Renglones',
    icon: 'i-lucide-list',
    slot: 'lines' as const,
    value: 'lines' satisfies QuoteEditorTabValue,
  },
  {
    label: 'Prompt AI',
    icon: 'i-lucide-sparkles',
    slot: 'ai' as const,
    value: 'ai' satisfies QuoteEditorTabValue,
  },
] as const;
