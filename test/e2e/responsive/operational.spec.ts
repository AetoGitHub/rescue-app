import { test, expect } from '@playwright/test';
import { assertNoHorizontalOverflow } from './helpers';

test.describe('Operational board responsive (guest)', () => {
  test('redirects unauthenticated users without layout overflow', async ({ page }) => {
    await page.goto('/admin/operational');
    await page.waitForURL(/\/login/);
    await assertNoHorizontalOverflow(page);
  });
});
