import { describe, expect, it } from 'vitest';
import {
  userCreateSchema,
  userCreateToCreateBody,
  userUpdateToUpdateBody,
} from '../../app/schemas/user-create';

const baseCreate = {
  username: 'VENDEDOR1',
  first_name: 'Ana',
  last_name: 'Pérez',
  email: 'ana@example.com',
  role: 'seller' as const,
  phone: '8112345678',
  commission: '70.00',
  password: 'password1',
  is_active: true,
};

describe('userCreateToCreateBody', () => {
  it('sends commission as a fraction (70 → 0.7)', () => {
    const parsed = userCreateSchema.parse(baseCreate);
    expect(userCreateToCreateBody(parsed).commission).toBe('0.7');
  });

  it('accepts 70% in the form value', () => {
    const parsed = userCreateSchema.parse({
      ...baseCreate,
      commission: '70%',
    });
    expect(userCreateToCreateBody(parsed).commission).toBe('0.7');
  });
});

describe('userUpdateToUpdateBody', () => {
  it('sends commission as a fraction', () => {
    const body = userUpdateToUpdateBody({
      username: 'VENDEDOR1',
      first_name: 'Ana',
      last_name: 'Pérez',
      email: 'ana@example.com',
      role: 'seller',
      phone: '8112345678',
      commission: '70.00',
      is_active: true,
    });
    expect(body.commission).toBe('0.7');
  });
});
