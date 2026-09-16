import { describe, expect, it } from 'vitest';
import { rescueAuthorizerContactCreateSchema } from '../../app/schemas/rescue-authorizer-assign';

describe('rescueAuthorizerContactCreateSchema email', () => {
  const emailField = rescueAuthorizerContactCreateSchema.shape.email;

  it('accepts a blank email', () => {
    expect(emailField.safeParse('').success).toBe(true);
    expect(emailField.safeParse('  ').success).toBe(true);
  });

  it('still rejects a malformed email', () => {
    expect(emailField.safeParse('not-an-email').success).toBe(false);
  });

  it('accepts a valid email', () => {
    expect(emailField.safeParse('a@b.com').success).toBe(true);
  });
});
