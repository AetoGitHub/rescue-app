import type { FillOcStaffToken } from '~/interfaces/nexxt-step/fill-oc';

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readUserId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function mapFillOcStaffToken(raw: unknown): FillOcStaffToken | null {
  if (typeof raw === 'string') {
    const token = raw.trim();
    return token ? { token, userId: null } : null;
  }

  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const token = readString(record.token || record.key || record.auth_token);
  if (!token) return null;

  const user = record.user;
  const userIdFromUser =
    user && typeof user === 'object'
      ? readUserId((user as Record<string, unknown>).id)
      : null;

  return {
    token,
    userId: readUserId(record.user_id) ?? readUserId(record.userId) ?? userIdFromUser,
  };
}
