import {
  SESSION_EXPIRED_CODE,
  SESSION_EXPIRED_MESSAGE,
} from '#shared/constants/session';

export function sessionExpiredError() {
  return createError({
    statusCode: 401,
    statusMessage: SESSION_EXPIRED_MESSAGE,
    message: SESSION_EXPIRED_MESSAGE,
    data: {
      code: SESSION_EXPIRED_CODE,
      message: SESSION_EXPIRED_MESSAGE,
    },
  });
}
