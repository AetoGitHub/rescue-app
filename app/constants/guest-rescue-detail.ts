export const GUEST_RESCUE_DETAIL_TAB_ITEMS = [
  { label: 'General', value: 'general', slot: 'general' as const },
  { label: 'Evidencia', value: 'evidence', slot: 'evidence' as const },
  { label: 'Cotización', value: 'quote', slot: 'quote' as const },
] as const;

export type GuestRescueDetailTabValue =
  (typeof GUEST_RESCUE_DETAIL_TAB_ITEMS)[number]['value'];

export const GUEST_AUTHORIZE_INVALID_TOKEN = 'invalid';
