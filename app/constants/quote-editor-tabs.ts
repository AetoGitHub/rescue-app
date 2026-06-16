export type QuoteEditorTabValue = 'lines' | 'prompt' | 'voice';

export const QUOTE_EDITOR_TAB_ITEMS = [
  {
    label: 'Renglones',
    icon: 'i-lucide-plus',
    slot: 'lines' as const,
    value: 'lines' satisfies QuoteEditorTabValue,
  },
  {
    label: 'Prompt IA',
    icon: 'i-lucide-sparkles',
    slot: 'prompt' as const,
    value: 'prompt' satisfies QuoteEditorTabValue,
  },
  {
    label: 'Voz',
    icon: 'i-lucide-mic',
    slot: 'voice' as const,
    value: 'voice' satisfies QuoteEditorTabValue,
  },
] as const;
