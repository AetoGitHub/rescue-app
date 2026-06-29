import { test, expect } from '@playwright/test';
import { assertNoHorizontalOverflow } from './helpers';

test.describe('Auth pages responsive', () => {
  test('login form is usable without horizontal overflow', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(page.getByLabel('Nombre de usuario')).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('password reset page renders on narrow viewport', async ({ page }) => {
    await page.goto('/password-reset');
    await expect(page.getByRole('link', { name: 'Volver al inicio de sesión' })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });
});
