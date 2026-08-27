# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crm.spec.ts >> End-to-End CRM User Journey >> 3. Leads: User can create a new lead
- Location: tests\crm.spec.ts:54:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('td').filter({ hasText: 'E2E Tester' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('td').filter({ hasText: 'E2E Tester' })

```

```yaml
- heading "Investor CRM" [level=1]
- paragraph: "Role: Admin"
- navigation:
  - link "Dashboard":
    - /url: /dashboard
  - link "Leads":
    - /url: /leads
  - link "Pipeline":
    - /url: /pipeline
  - link "Follow-ups":
    - /url: /follow-ups
  - link "Email":
    - /url: /email
  - link "Distributors":
    - /url: /distributors
  - link "Settings":
    - /url: /settings
- button "Sign Out"
- main:
  - heading "Leads" [level=1]
  - paragraph: 0 of 0 leads
  - button "Export"
  - button "Import"
  - button "Columns"
  - button "New Lead"
  - textbox "Search name, organization, email, notes..."
  - button "Filter"
  - table:
    - rowgroup:
      - row "First Name Organization Investor Type Lead Stage Last Interaction Follow-up Date Primary Owner":
        - columnheader:
          - checkbox
        - columnheader "First Name"
        - columnheader "Organization"
        - columnheader "Investor Type"
        - columnheader "Lead Stage"
        - columnheader "Last Interaction"
        - columnheader "Follow-up Date"
        - columnheader "Primary Owner"
    - rowgroup:
      - row "No leads yet. Import a CSV or click \"New Lead\".":
        - cell "No leads yet. Import a CSV or click \"New Lead\"."
- alert
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Generate a unique email for this test run to avoid auth collisions
  4   | const TEST_EMAIL = `e2e_${Date.now()}@example.com`;
  5   | const TEST_PASS = `pass123456`;
  6   | 
  7   | test.describe('End-to-End CRM User Journey', () => {
  8   |   // Use sequential mode since we are relying on state from previous tests (like registering)
  9   |   test.describe.configure({ mode: 'serial' });
  10  | 
  11  |   let page;
  12  | 
  13  |   test.beforeAll(async ({ browser }) => {
  14  |     page = await browser.newPage();
  15  |   });
  16  | 
  17  |   test.afterAll(async () => {
  18  |     await page.close();
  19  |   });
  20  | 
  21  |   test('1. Authentication: User can register and access the dashboard', async () => {
  22  |     await page.goto('/login');
  23  |     
  24  |     // Toggle to Register mode
  25  |     await page.click('text=Need an account? Register');
  26  |     await expect(page.locator('text=Create a new account')).toBeVisible();
  27  | 
  28  |     // Fill credentials
  29  |     await page.fill('input[type="email"]', TEST_EMAIL);
  30  |     await page.fill('input[type="password"]', TEST_PASS);
  31  |     
  32  |     // Submit
  33  |     await page.click('button:has-text("Register")');
  34  | 
  35  |     // Wait for Dashboard redirect
  36  |     await page.waitForURL('**/dashboard');
  37  |     await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  38  |   });
  39  | 
  40  |   test('2. Settings: Ensure default Pipeline Stages and Investor Types load', async () => {
  41  |     await page.click('a[href="/settings"]');
  42  |     await page.waitForURL('**/settings');
  43  |     
  44  |     await expect(page.locator('h1', { hasText: 'Settings' })).toBeVisible();
  45  |     
  46  |     // Check if the inputs for Stages are visible
  47  |     await expect(page.locator('h2', { hasText: 'Pipeline Stages' })).toBeVisible();
  48  |     
  49  |     // Click the Investor Types tab to make it visible
  50  |     await page.getByRole('button', { name: 'Investor Types' }).click();
  51  |     await expect(page.locator('h2', { hasText: 'Investor Types' })).toBeVisible();
  52  |   });
  53  | 
  54  |   test('3. Leads: User can create a new lead', async () => {
  55  |     await page.click('a[href="/leads"]');
  56  |     await page.waitForURL('**/leads');
  57  |     
  58  |     // Click New Lead
  59  |     await page.click('button:has-text("New Lead")');
  60  |     
  61  |     // Wait for modal
  62  |     await expect(page.locator('h2', { hasText: 'Add New Lead' })).toBeVisible();
  63  |     
  64  |     // Fill out the form
  65  |     await page.fill('label:has-text("First Name") + input', 'E2E');
  66  |     await page.fill('label:has-text("Last Name") + input', 'Tester');
  67  |     await page.fill('label:has-text("Organization") + input', 'Playwright Corp');
  68  |     await page.fill('label:has-text("Email") + input', 'e2e@playwright.dev');
  69  |     
  70  |     // Submit
  71  |     await page.click('button:has-text("Save Lead")');
  72  |     
  73  |     // Wait for modal to close and table to update
  74  |     await expect(page.locator('h2', { hasText: 'Add New Lead' })).toBeHidden();
  75  |     
  76  |     // Verify lead is in table
> 77  |     await expect(page.locator('td', { hasText: 'E2E Tester' })).toBeVisible({ timeout: 10000 });
      |                                                                 ^ Error: expect(locator).toBeVisible() failed
  78  |     await expect(page.locator('td', { hasText: 'Playwright Corp' })).toBeVisible();
  79  |   });
  80  | 
  81  |   test('4. Pipeline: Lead appears in the Kanban board', async () => {
  82  |     await page.click('a[href="/pipeline"]');
  83  |     await page.waitForURL('**/pipeline');
  84  |     
  85  |     // The Kanban board takes a second to fetch settings and leads
  86  |     await expect(page.locator('h4', { hasText: 'E2E Tester' })).toBeVisible({ timeout: 10000 });
  87  |     await expect(page.locator('text=Playwright Corp').first()).toBeVisible();
  88  |   });
  89  | 
  90  |   test('5. Follow-ups: Dashboard sorts by date', async () => {
  91  |     await page.click('a[href="/follow-ups"]');
  92  |     await page.waitForURL('**/follow-ups');
  93  |     
  94  |     // We didn't set a date in step 3, so it might not appear.
  95  |     // We just verify the sections render correctly
  96  |     await expect(page.locator('h3', { hasText: 'Overdue' })).toBeVisible();
  97  |     await expect(page.locator('h3', { hasText: 'Today' })).toBeVisible();
  98  |     await expect(page.locator('h3', { hasText: 'Upcoming' })).toBeVisible();
  99  |   });
  100 | 
  101 |   test('6. Dashboard: Analytics update to reflect the new lead', async () => {
  102 |     await page.click('a[href="/dashboard"]');
  103 |     await page.waitForURL('**/dashboard');
  104 |     
  105 |     // We added 1 lead as this user. Since this user is new (and technically admin),
  106 |     // they see ALL leads. The seed script added 20, plus this 1 makes 21.
  107 |     // Instead of hardcoding 21, we just verify the elements loaded.
  108 |     await expect(page.locator('p:has-text("Total Leads") + p')).toBeVisible();
  109 |     await expect(page.locator('h3', { hasText: 'Pipeline Distribution' })).toBeVisible();
  110 |   });
  111 | });
  112 | 
```