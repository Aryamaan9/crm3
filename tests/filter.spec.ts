import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e_filter_${Date.now()}@example.com`;
const TEST_PASS = `pass123456`;

test.describe('Excel-like Header Filters', () => {
  test.describe.configure({ mode: 'serial' });

  let page: any;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Authentication', async () => {
    await page.goto('/login');
    await page.click('text=Need an account? Register');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button:has-text("Register")');
    await page.waitForURL('**/dashboard');
  });

  test('2. Filter Leads Table', async () => {
    await page.goto('/leads');
    
    // Add a lead first to ensure we have data
    await page.click('button:has-text("New Lead")');
    await page.fill('input[placeholder="First Name"]', 'FilterTest');
    await page.fill('input[placeholder="Last Name"]', 'User');
    await page.fill('input[placeholder="Organization"]', 'TestOrg');
    await page.click('button:has-text("Add Lead"):visible');
    
    await expect(page.locator('text=Lead added successfully')).toBeVisible();

    // Verify lead is in table
    await expect(page.locator('td:has-text("FilterTest")')).toBeVisible();

    // Click the First Name filter menu
    // The filter menu is inside the <th> for "First Name"
    const firstNameHeader = page.locator('th:has-text("First Name")');
    await firstNameHeader.locator('button').first().click();

    // Uncheck "FilterTest"
    const checkbox = page.locator('span:has-text("FilterTest")').locator('..').locator('input[type="checkbox"]');
    await checkbox.uncheck();
    
    // Click Apply
    await page.click('button:has-text("Apply")');

    // Verify lead is filtered out
    await expect(page.locator('td:has-text("FilterTest")')).not.toBeVisible();
  });
});
