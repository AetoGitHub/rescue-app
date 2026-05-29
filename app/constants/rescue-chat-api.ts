/** List chat messages (cursor pagination). */
export const RESCUE_CHAT_MESSAGES_PATH = (rescueId: number) =>
  `/api/chat/${rescueId}/messages/`;

/** Create a user chat message (detail chat and card quick message). */
export const RESCUE_CHAT_MESSAGE_CREATE_PATH = (rescueId: number) =>
  `/api/chat/${rescueId}/messages/create/`;
