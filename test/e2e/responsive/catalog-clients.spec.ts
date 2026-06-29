import { test, expect } from '@playwright/test';
import { assertNoHorizontalOverflow } from './helpers';

test.describe('Catalog clients responsive (guest)', () => {
  test('redirects unauthenticated users without layout overflow', async ({ page }) => {
    await page.goto('/admin/catalogs/clients');
    await page.waitForURL(/\/login/);
    await assertNoHorizontalOverflow(page);
  });
});
