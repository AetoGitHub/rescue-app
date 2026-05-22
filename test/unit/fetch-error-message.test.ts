import { describe, expect, it } from 'vitest';
import {
  getApiDetailMessage,
  getPasswordResetErrorMessage,
} from '../../app/utils/fetch-error-message';

describe('getApiDetailMessage', () => {
  it('reads string detail from error.data', () => {
    const msg = getApiDetailMessage({
      data: { detail: 'Código inválido o expirado.' },
    });
    expect(msg).toBe('Código inválido o expirado.');
  });

  it('joins array detail', () => {
    const msg = getApiDetailMessage({
      data: { detail: ['La contraseña es muy débil.', 'El código no existe.'] },
    });
    expect(msg).toBe('La contraseña es muy débil. El código no existe.');
  });
});

describe('getPasswordResetErrorMessage', () => {
  it('prefers detail over generic message', () => {
    const msg = getPasswordResetErrorMessage({
      statusCode: 400,
      message: '[POST] "/api/auth/password-reset/confirm": 400 Bad Request',
      data: { detail: 'Las contraseñas no coinciden.' },
    });
    expect(msg).toBe('Las contraseñas no coinciden.');
  });
});
