import * as Sentry from '@sentry/nuxt';

export type SessionAuthFailureReason =
  | 'missing_token'
  | 'refresh_cleared_session'
  | 'upstream_auth_failure';

export type SessionAuthFailureContext = {
  reason: SessionAuthFailureReason;
  path: string;
  requestId?: string;
  status?: number;
  hadToken: boolean;
  refreshClearedSession: boolean;
};

export function reportSessionAuthFailure(ctx: SessionAuthFailureContext) {
  Sentry.captureMessage(`session_auth:${ctx.reason}`, {
    level: 'warning',
    extra: {
      path: ctx.path,
      request_id: ctx.requestId,
      status: ctx.status,
      had_token: ctx.hadToken,
      refresh_cleared_session: ctx.refreshClearedSession,
    },
    tags: {
      http_status: String(ctx.status ?? 401),
      api_path: ctx.path.split('?')[0] ?? ctx.path,
      session_auth_reason: ctx.reason,
    },
  });
}
