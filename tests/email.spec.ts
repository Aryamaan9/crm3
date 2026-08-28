import { test, expect } from '@playwright/test';

// Use a generated email or a test one
const TEST_EMAIL = `e2e_${Date.now()}@example.com`;
const TEST_PASS = `pass123456`;

test.describe('Email Composer & Brevo Integration', () => {
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
    await expect(page.locator('text=Create a new account')).toBeVisible();

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASS);
    await page.click('button:has-text("Register")');

    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  });

  test('2. Leads: Create a test lead for the campaign', async () => {
    await page.goto('/leads');
    await page.click('button:has-text("New Lead")');
    await expect(page.locator('h2', { hasText: 'Add New Lead' })).toBeVisible();
    
    // For test email delivery, use info@moneystories.in (as user requested)
    await page.fill('label:has-text("First Name") + input', 'Brevo');
    await page.fill('label:has-text("Last Name") + input', 'Tester');
    await page.fill('label:has-text("Organization") + input', 'Test Corp');
    await page.fill('label:has-text("Email") + input', 'info@moneystories.in');
    
    await page.click('button:has-text("Save Lead")');
    await expect(page.locator('h2', { hasText: 'Add New Lead' })).toBeHidden();
  });

  test('3. Email: Compose and dispatch a campaign', async () => {
    await page.goto('/email');
    
    // Verify Dashboard loads
    await expect(page.locator('h1', { hasText: 'Email Broadcasts' })).toBeVisible();
    
    // Search for our test lead to select them
    await page.fill('input[placeholder="Search leads..."]', 'info@moneystories.in');
    await page.waitForTimeout(500); // Wait for filter to apply
    
    // Select the lead
    await page.click('text=Select All Filtered');
    
    // Click Compose
    await page.click('button:has-text("Compose for 1 Recipients")');
    
    // Verify Composer opened
    await expect(page.locator('h2', { hasText: 'Composer' })).toBeVisible();
    
    // Fill out the campaign fields
    await page.fill('input[placeholder="e.g. Q1 Newsletter"]', 'E2E Test Campaign');
    await page.fill('input[placeholder="Exciting updates for {{organization}}"]', 'E2E Test for {{organization}}');
    
    // Note: If Brevo API key is missing, the button is disabled. 
    // We assume the user has configured the API key in their actual Firebase database.
    const sendButton = page.locator('button', { hasText: 'Dispatch Campaign' });
    
    // If it's disabled, we can't click it (meaning API key isn't set in global settings).
    // We'll assert it's visible. If they have the key set, it will dispatch.
    await expect(sendButton).toBeVisible();
    
    const isDisabled = await sendButton.isDisabled();
    if (!isDisabled) {
      // Actually send it!
      await sendButton.click();
      
      // Wait for success toast
      await expect(page.locator('text=Successfully dispatched')).toBeVisible({ timeout: 15000 });
      
      // Verify campaign is now in history
      await expect(page.locator('h2', { hasText: 'Composer' })).toBeHidden();
      await expect(page.locator('td', { hasText: 'E2E Test Campaign' })).toBeVisible();
    } else {
      console.log('Skipping actual send because Brevo API Key is not configured in the test environment.');
    }
  });
});
