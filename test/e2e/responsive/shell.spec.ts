import { test, expect } from '@playwright/test';
import { assertNoHorizontalOverflow } from './helpers';

test.describe('App shell responsive', () => {
  test('login page shows brand and navigation link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test('unauthenticated admin route redirects to login', async ({ page }) => {
    await page.goto('/admin/operational');
    await page.waitForURL(/\/login/);
    await assertNoHorizontalOverflow(page);
  });
});
