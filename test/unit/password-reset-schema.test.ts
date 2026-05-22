import { describe, expect, it } from 'vitest';
import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '../../app/schemas/password-reset';

describe('passwordResetRequestSchema', () => {
  it('rejects empty identifier', () => {
    const result = passwordResetRequestSchema.safeParse({ identifier: '   ' });
    expect(result.success).toBe(false);
  });

  it('accepts trimmed identifier', () => {
    const result = passwordResetRequestSchema.safeParse({
      identifier: '  usuario@correo.com  ',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.identifier).toBe('usuario@correo.com');
    }
  });
});

describe('passwordResetConfirmSchema', () => {
  it('requires at least 8 characters', () => {
    const result = passwordResetConfirmSchema.safeParse({
      code: 'abc',
      password: 'short',
      password2: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = passwordResetConfirmSchema.safeParse({
      code: 'code-123',
      password: 'password1',
      password2: 'password2',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid confirm payload', () => {
    const result = passwordResetConfirmSchema.safeParse({
      code: 'tu-codigo-aqui',
      password: 'nueva_password',
      password2: 'nueva_password',
    });
    expect(result.success).toBe(true);
  });
});
