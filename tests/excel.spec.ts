import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e_excel_${Date.now()}@example.com`;
const TEST_PASS = `pass123456`;

test.describe('Excel Mode & Data Sync', () => {
  test.describe.configure({ mode: 'serial' });

  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Authentication: Register and access dashboard', async () => {
    await page.goto('/login');
    await page.click('text=Need an account? Register');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button:has-text("Register")');
    await page.waitForURL('**/dashboard');
  });

  test('2. Excel Mode: Enable and interact', async () => {
    await page.goto('/leads');
    
    // Switch to Excel Mode
    await page.click('button:has-text("Excel Mode")');
    
    // Wait for grid to render
    await expect(page.locator('.dsg-container')).toBeVisible({ timeout: 10000 });
    
    // The datasheet grid has standard classes. We can verify columns.
    await expect(page.locator('text=Organization').first()).toBeVisible();
    
    // Simulate typing in the first cell of a new row
    // In react-datasheet-grid, clicking a cell activates it
    // Wait for the grid rows
    const firstRowCell = page.locator('.dsg-cell').nth(1); 
    await firstRowCell.click();
    await page.keyboard.type('Test Org Sync');
    await page.keyboard.press('Enter');

    // Verify it triggers a save toast
    await expect(page.locator('text=Sync successful')).toBeVisible({ timeout: 15000 });
  });
});
