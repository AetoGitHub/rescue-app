import { test, expect } from '@playwright/test';
import { assertNoHorizontalOverflow } from './helpers';

test.describe('Administrative board responsive (guest)', () => {
  test('redirects unauthenticated users without layout overflow', async ({ page }) => {
    await page.goto('/admin/administrativo');
    await page.waitForURL(/\/login/);
    await assertNoHorizontalOverflow(page);
  });
});
