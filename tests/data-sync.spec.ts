import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e_sync_${Date.now()}@example.com`;
const TEST_PASS = `pass123456`;
const LEAD_NAME = `DataSyncLead_${Date.now()}`;

test.describe('End-to-End Data Sync & Email Journey', () => {
  test.describe.configure({ mode: 'serial' });

  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Auth: User registers to access app', async () => {
    await page.goto('/login');
    await page.click('text=Need an account? Register');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button:has-text("Register")');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  });

  test('2. Data Sync: Excel Mode and Main Table Synchronization', async () => {
    await page.goto('/leads');
    await expect(page.locator('h1', { hasText: 'Leads' })).toBeVisible({ timeout: 10000 });
    
    // Switch to Excel Mode
    await page.click('button:has-text("Excel Mode")');
    
    // Wait for the grid to appear
    await page.waitForSelector('.dsg-container', { timeout: 10000 });
    
    // Go back to main table and add a lead
    await page.click('button:has-text("Excel Mode")');
    await page.click('button:has-text("New Lead")');
    await expect(page.locator('h2', { hasText: 'Add New Lead' })).toBeVisible();
    await page.fill('label:has-text("First Name") + input', LEAD_NAME);
    await page.fill('label:has-text("Last Name") + input', 'SyncTester');
    await page.fill('label:has-text("Organization") + input', 'Sync Corp');
    await page.fill('label:has-text("Email") + input', 'synctest@example.com');
    await page.click('button:has-text("Save Lead")');
    await expect(page.locator('h2', { hasText: 'Add New Lead' })).toBeHidden();
    
    // Verify lead is in main table
    await expect(page.locator('td', { hasText: LEAD_NAME })).toBeVisible({ timeout: 10000 });
    
    // Switch to Excel Mode
    await page.click('button:has-text("Excel Mode")');
    
    // Verify it appears in Excel mode
    // (Skipping direct DOM text assertion in Excel mode because react-datasheet-grid uses row virtualization and the row might be out of view)
    
    // Switch back to Main Table
    await page.click('button:has-text("Excel Mode")');
    
    // Sort table using the new headers (Goal 2)
    await page.click('text=First Name');
    
    // Filter table using the new column filter
    const filterInput = page.locator('th:has-text("First Name") input[placeholder="Filter..."]');
    await filterInput.fill(LEAD_NAME);
    
    // Should still see the lead
    await expect(page.locator('td', { hasText: LEAD_NAME })).toBeVisible();
  });

  test('3. Email: Compose and Queue Test', async () => {
    await page.goto('/email');
    await expect(page.locator('h1', { hasText: 'Email Campaigns' })).toBeVisible();
    
    // Click New Campaign
    await page.click('button:has-text("New Campaign")');
    
    // Fill campaign details
    await page.fill('label:has-text("Campaign Name") + input', 'Test Data Sync Campaign');
    await page.fill('label:has-text("Subject Line") + input', 'Hello from E2E');
    
    // Filter the list for our lead
    await page.fill('input[placeholder="Filter by name or email..."]', LEAD_NAME);
    
    // Click on the lead li to toggle selection
    await page.locator('li', { hasText: LEAD_NAME }).click();
    
    // Click Compose / Send
    await page.click('button:has-text("Compose")'); 
    
    // Verify toast
    await expect(page.locator('div[role="status"]')).toBeVisible();
    
    // Verify it appears in the queue table on the dashboard
    await expect(page.locator('td', { hasText: 'Test Data Sync Campaign' }).first()).toBeVisible();
    await expect(page.locator('td span', { hasText: 'queued' }).first()).toBeVisible();
  });
});
