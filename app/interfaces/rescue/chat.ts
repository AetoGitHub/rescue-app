export type RescueChatMessageType = 'user' | 'system';

export interface RescueChatMessage {
  id: number;
  type: RescueChatMessageType;
  text: string;
  created_at: string;
  created_by_id: number | null;
  created_by_name: string | null;
  response_to_id: number | null;
}

export interface RescueChatMessageCreateBody {
  text: string;
  response_to: number | null;
}

export interface RescueChatMessageCreateResponse {
  id: number;
}
