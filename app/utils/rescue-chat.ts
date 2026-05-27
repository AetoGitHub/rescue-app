import type { RescueChatMessage } from '~/interfaces/rescue';

export type RescueChatMessageVariant = 'system' | 'own' | 'other';

export function getRescueChatMessageVariant(
  message: Pick<RescueChatMessage, 'type' | 'created_by_id'>,
  currentUserId: number | undefined | null,
): RescueChatMessageVariant {
  if (message.type === 'system') return 'system';
  if (
    currentUserId != null &&
    message.created_by_id != null &&
    message.created_by_id === currentUserId
  ) {
    return 'own';
  }
  return 'other';
}

export function getRescueChatMessageSenderLabel(
  message: Pick<RescueChatMessage, 'created_by_name'>,
  variant: RescueChatMessageVariant,
): string {
  if (variant === 'system') return 'Sistema';
  if (variant === 'own') return 'Tú';
  const name = message.created_by_name?.trim();
  return name || 'Usuario';
}
