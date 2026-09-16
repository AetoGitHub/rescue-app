import { OWN_PERMISSION_CODE } from '#shared/constants/session';

export function ownPermissionError(message = 'No tienes permiso para esta acción.') {
  return createError({
    statusCode: 403,
    statusMessage: message,
    message,
    data: {
      code: OWN_PERMISSION_CODE,
      message,
    },
  });
}
