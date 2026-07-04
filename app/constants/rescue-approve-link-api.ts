export const RESCUE_APPROVE_LINK_GENERATE_PATH = (rescueId: number) =>
  `/api/rescue/approve_link/${rescueId}/generate/`;

export const RESCUE_GUEST_CARD_DETAIL_PATH = (rescueId: number, token: string) =>
  `/api/rescue/cards/${rescueId}/${encodeURIComponent(token)}/`;

export const RESCUE_GUEST_QUOTE_DETAIL_PATH = (rescueId: number, token: string) =>
  `/api/rescue/quote/detail/${rescueId}/${encodeURIComponent(token)}/`;

export const RESCUE_GUEST_EVIDENCE_LIST_PATH = (rescueId: number, token: string) =>
  `/api/rescue/evidence/${rescueId}/${encodeURIComponent(token)}/`;

export const RESCUE_GUEST_CHAT_MESSAGES_PATH = (rescueId: number, token: string) =>
  `/api/chat/${rescueId}/messages/${encodeURIComponent(token)}/`;

export const RESCUE_GUEST_CHAT_MESSAGE_CREATE_PATH = (
  rescueId: number,
  token: string,
) => `/api/chat/${rescueId}/messages/create/${encodeURIComponent(token)}/`;

export const RESCUE_GUEST_APPROVE_PATH = (rescueId: number, token: string) =>
  `/api/rescue/approve_link/${rescueId}/${encodeURIComponent(token)}/`;

export const GUEST_AUTHORIZATION_PATH_SEGMENT = 'authorization' as const;
