import { describe, expect, it } from 'vitest';
import {
  RESCUE_GUEST_CARD_DETAIL_PATH,
  RESCUE_GUEST_CHAT_MESSAGE_CREATE_PATH,
  RESCUE_GUEST_CHAT_MESSAGES_PATH,
  RESCUE_GUEST_EVIDENCE_LIST_PATH,
  RESCUE_GUEST_QUOTE_DETAIL_PATH,
} from '~/constants/rescue-approve-link-api';

describe('guest rescue API paths', () => {
  const rescueId = 44;
  const token = 'abc/xyz';

  it('builds card detail path', () => {
    expect(RESCUE_GUEST_CARD_DETAIL_PATH(rescueId, token)).toBe(
      '/api/rescue/cards/44/abc%2Fxyz/',
    );
  });

  it('builds quote detail path', () => {
    expect(RESCUE_GUEST_QUOTE_DETAIL_PATH(rescueId, token)).toBe(
      '/api/rescue/quote/detail/44/abc%2Fxyz/',
    );
  });

  it('builds evidence list path', () => {
    expect(RESCUE_GUEST_EVIDENCE_LIST_PATH(rescueId, token)).toBe(
      '/api/rescue/evidence/44/abc%2Fxyz/',
    );
  });

  it('builds chat messages path', () => {
    expect(RESCUE_GUEST_CHAT_MESSAGES_PATH(rescueId, token)).toBe(
      '/api/chat/44/messages/abc%2Fxyz/',
    );
  });

  it('builds chat create path', () => {
    expect(RESCUE_GUEST_CHAT_MESSAGE_CREATE_PATH(rescueId, token)).toBe(
      '/api/chat/44/messages/create/abc%2Fxyz/',
    );
  });
});
