export const RESCUE_APPROVE_LINK_GENERATE_PATH = (rescueId: number) =>
  `/api/rescue/approve_link/${rescueId}/generate/`;

export const RESCUE_GUEST_CARD_DETAIL_PATH = (rescueId: number, token: string) =>
  `/api/rescue/cards/${rescueId}/${encodeURIComponent(token)}/`;

export const RESCUE_GUEST_APPROVE_PATH = (rescueId: number, token: string) =>
  `/api/rescue/approve_link/${rescueId}/${encodeURIComponent(token)}/`;

export const GUEST_AUTHORIZATION_PATH_SEGMENT = 'authorization' as const;
