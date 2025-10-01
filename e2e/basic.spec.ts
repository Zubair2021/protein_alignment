import { test, expect } from '@playwright/test'

test('workspace renders overview tab', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Welcome to HelixCanvas')).toBeVisible()
})
