# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: data-sync.spec.ts >> End-to-End Data Sync & Email Journey >> 3. Email: Compose and Queue Test
- Location: tests\data-sync.spec.ts:74:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('button:has-text("Compose")')

```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - generic [ref=f2e2]:
    - generic [ref=f2e3]:
      - generic [ref=f2e4]:
        - heading "Investor CRM" [level=1] [ref=f2e5]
        - paragraph [ref=f2e6]: "Role: Admin"
      - navigation [ref=f2e7]:
        - link "Dashboard" [ref=f2e8] [cursor=pointer]:
          - /url: /dashboard
        - link "Leads" [ref=f2e14] [cursor=pointer]:
          - /url: /leads
        - link "Pipeline" [ref=f2e20] [cursor=pointer]:
          - /url: /pipeline
        - link "Follow-ups" [ref=f2e24] [cursor=pointer]:
          - /url: /follow-ups
        - link "Email" [ref=f2e27] [cursor=pointer]:
          - /url: /email
        - link "Distributors" [ref=f2e31] [cursor=pointer]:
          - /url: /distributors
        - link "Settings" [ref=f2e36] [cursor=pointer]:
          - /url: /settings
      - button "Sign Out" [ref=f2e41]
    - main [ref=f2e45]:
      - generic [ref=f2e47]:
        - generic [ref=f2e48]:
          - generic [ref=f2e54]:
            - heading "Compose Investor Campaign" [level=2] [ref=f2e55]
            - paragraph [ref=f2e56]: Targeted outreach with Brevo delivery and dynamic CRM personalization.
          - generic [ref=f2e57]:
            - button "Send Campaign" [ref=f2e58]
            - button "Live Preview" [ref=f2e59]
            - button [ref=f2e63]
        - generic [ref=f2e67]:
          - generic [ref=f2e68]:
            - generic [ref=f2e69]:
              - generic [ref=f2e70]:
                - text: Campaign Name (Internal)
                - textbox "e.g. Q1 Fund II Performance Note" [ref=f2e71]: Test Data Sync Campaign
              - generic [ref=f2e72]:
                - text: From Sender
                - textbox [ref=f2e73]: Money Stories IR <ir@moneystories.in>
            - generic [ref=f2e74]:
              - text: Subject Line
              - 'textbox "e.g. Exclusive Update: Fund II Q1 Track Record for {{organization}}" [ref=f2e75]': Hello from E2E
            - generic [ref=f2e76]:
              - generic [ref=f2e77]:
                - generic [ref=f2e78]: "✨ Insert Personalization Tag:"
                - generic [ref=f2e79]: Click to insert at cursor
              - generic [ref=f2e80]:
                - 'button "{{first_name}} (First Name)" [ref=f2e81]':
                  - text: "{{first_name}}"
                  - generic [ref=f2e82]: (First Name)
                - 'button "{{last_name}} (Last Name)" [ref=f2e83]':
                  - text: "{{last_name}}"
                  - generic [ref=f2e84]: (Last Name)
                - 'button "{{organization}} (Organization)" [ref=f2e85]':
                  - text: "{{organization}}"
                  - generic [ref=f2e86]: (Organization)
                - 'button "{{email}} (Email)" [ref=f2e87]':
                  - text: "{{email}}"
                  - generic [ref=f2e88]: (Email)
                - 'button "{{investor_type}} (Investor Type)" [ref=f2e89]':
                  - text: "{{investor_type}}"
                  - generic [ref=f2e90]: (Investor Type)
                - 'button "{{lead_stage}} (Lead Stage)" [ref=f2e91]':
                  - text: "{{lead_stage}}"
                  - generic [ref=f2e92]: (Lead Stage)
                - 'button "{{current_country}} (Country)" [ref=f2e93]':
                  - text: "{{current_country}}"
                  - generic [ref=f2e94]: (Country)
            - generic [ref=f2e95]:
              - generic [ref=f2e96]:
                - generic [ref=f2e97]: HTML Message Body
                - generic [ref=f2e98]:
                  - button "HTML Source" [ref=f2e99]
                  - button "Rendered" [ref=f2e100]
              - textbox [ref=f2e101]: "<p>Dear {{first_name}},</p> <p>We are pleased to share our latest fund performance update regarding <strong>{{organization}}</strong>.</p> <p>Warm regards,<br>The Team</p>"
          - generic [ref=f2e102]:
            - generic [ref=f2e103]:
              - heading "Investor Group Filters" [level=3] [ref=f2e104]
              - generic [ref=f2e107]: 1 Selected
            - generic [ref=f2e108]:
              - generic [ref=f2e109]:
                - generic [ref=f2e110]: Investor List
                - combobox [ref=f2e111]:
                  - option "All Lists" [selected]
              - generic [ref=f2e112]:
                - generic [ref=f2e113]: Investor Type
                - combobox [ref=f2e114]:
                  - option "All Types" [selected]
                  - option "Angel Investor"
                  - option "Venture Capital"
                  - option "Family Office"
                  - option "Private Equity"
                  - option "High Net Worth"
              - generic [ref=f2e115]:
                - generic [ref=f2e116]: Pipeline Stage
                - combobox [ref=f2e117]:
                  - option "All Stages" [selected]
                  - option "New"
                  - option "Initial Outreach"
                  - option "Meeting Scheduled"
                  - option "Due Diligence"
                  - option "Closed Won"
                  - option "Closed Lost"
              - generic [ref=f2e118]:
                - generic [ref=f2e119]: Fund / Client Type
                - combobox [ref=f2e120]:
                  - option "All Funds" [selected]
            - generic [ref=f2e121]:
              - generic [ref=f2e122]:
                - text: "Matches:"
                - strong [ref=f2e123]: "1"
                - text: leads
              - generic [ref=f2e124]:
                - button "Select All" [ref=f2e125]
                - generic [ref=f2e126]: ·
                - button "Clear" [ref=f2e127]
            - textbox "Filter by name or email..." [ref=f2e132]: DataSyncLead_1787893232566
            - list [ref=f2e134]:
              - listitem [ref=f2e135] [cursor=pointer]:
                - checkbox [checked] [ref=f2e136]
                - generic [ref=f2e137]:
                  - paragraph [ref=f2e138]: DataSyncLead_1787893232566 SyncTester
                  - paragraph [ref=f2e139]: synctest@example.com
  - generic [ref=f2e144] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=f2e145]
    - generic [ref=f2e149]:
      - button "Open issues overlay" [ref=f2e150]:
        - generic [ref=f2e151]:
          - generic [ref=f2e152]: "0"
          - generic [ref=f2e153]: "1"
        - generic [ref=f2e154]: Issue
      - button "Collapse issues badge" [ref=f2e155]
  - alert [ref=f2e158]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const TEST_EMAIL = `e2e_sync_${Date.now()}@example.com`;
  4   | const TEST_PASS = `pass123456`;
  5   | const LEAD_NAME = `DataSyncLead_${Date.now()}`;
  6   | 
  7   | test.describe('End-to-End Data Sync & Email Journey', () => {
  8   |   test.describe.configure({ mode: 'serial' });
  9   | 
  10  |   let page;
  11  | 
  12  |   test.beforeAll(async ({ browser }) => {
  13  |     page = await browser.newPage();
  14  |   });
  15  | 
  16  |   test.afterAll(async () => {
  17  |     await page.close();
  18  |   });
  19  | 
  20  |   test('1. Auth: User registers to access app', async () => {
  21  |     await page.goto('/login');
  22  |     await page.click('text=Need an account? Register');
  23  |     await page.fill('input[type="email"]', TEST_EMAIL);
  24  |     await page.fill('input[type="password"]', TEST_PASS);
  25  |     await page.click('button:has-text("Register")');
  26  |     await page.waitForURL('**/dashboard');
  27  |     await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  28  |   });
  29  | 
  30  |   test('2. Data Sync: Excel Mode and Main Table Synchronization', async () => {
  31  |     await page.goto('/leads');
  32  |     await expect(page.locator('h1', { hasText: 'Leads' })).toBeVisible({ timeout: 10000 });
  33  |     
  34  |     // Switch to Excel Mode
  35  |     await page.click('button:has-text("Excel Mode")');
  36  |     
  37  |     // Wait for the grid to appear
  38  |     await page.waitForSelector('.dsg-container', { timeout: 10000 });
  39  |     
  40  |     // Go back to main table and add a lead
  41  |     await page.click('button:has-text("Excel Mode")');
  42  |     await page.click('button:has-text("New Lead")');
  43  |     await expect(page.locator('h2', { hasText: 'Add New Lead' })).toBeVisible();
  44  |     await page.fill('label:has-text("First Name") + input', LEAD_NAME);
  45  |     await page.fill('label:has-text("Last Name") + input', 'SyncTester');
  46  |     await page.fill('label:has-text("Organization") + input', 'Sync Corp');
  47  |     await page.fill('label:has-text("Email") + input', 'synctest@example.com');
  48  |     await page.click('button:has-text("Save Lead")');
  49  |     await expect(page.locator('h2', { hasText: 'Add New Lead' })).toBeHidden();
  50  |     
  51  |     // Verify lead is in main table
  52  |     await expect(page.locator('td', { hasText: LEAD_NAME })).toBeVisible({ timeout: 10000 });
  53  |     
  54  |     // Switch to Excel Mode
  55  |     await page.click('button:has-text("Excel Mode")');
  56  |     
  57  |     // Verify it appears in Excel mode
  58  |     // (Skipping direct DOM text assertion in Excel mode because react-datasheet-grid uses row virtualization and the row might be out of view)
  59  |     
  60  |     // Switch back to Main Table
  61  |     await page.click('button:has-text("Excel Mode")');
  62  |     
  63  |     // Sort table using the new headers (Goal 2)
  64  |     await page.click('text=First Name');
  65  |     
  66  |     // Filter table using the new column filter
  67  |     const filterInput = page.locator('th:has-text("First Name") input[placeholder="Filter..."]');
  68  |     await filterInput.fill(LEAD_NAME);
  69  |     
  70  |     // Should still see the lead
  71  |     await expect(page.locator('td', { hasText: LEAD_NAME })).toBeVisible();
  72  |   });
  73  | 
  74  |   test('3. Email: Compose and Queue Test', async () => {
  75  |     await page.goto('/email');
  76  |     await expect(page.locator('h1', { hasText: 'Email Campaigns' })).toBeVisible();
  77  |     
  78  |     // Click New Campaign
  79  |     await page.click('button:has-text("New Campaign")');
  80  |     
  81  |     // Fill campaign details
  82  |     await page.fill('label:has-text("Campaign Name") + input', 'Test Data Sync Campaign');
  83  |     await page.fill('label:has-text("Subject Line") + input', 'Hello from E2E');
  84  |     
  85  |     // Filter the list for our lead
  86  |     await page.fill('input[placeholder="Filter by name or email..."]', LEAD_NAME);
  87  |     
  88  |     // Click on the lead li to toggle selection
  89  |     await page.locator('li', { hasText: LEAD_NAME }).click();
  90  |     
  91  |     // Click Compose / Send
> 92  |     await page.click('button:has-text("Compose")'); 
      |                ^ Error: page.click: Target page, context or browser has been closed
  93  |     
  94  |     // Verify toast
  95  |     await expect(page.locator('div[role="status"]')).toBeVisible();
  96  |     
  97  |     // Verify it appears in the queue table on the dashboard
  98  |     await expect(page.locator('td', { hasText: 'Test Data Sync Campaign' }).first()).toBeVisible();
  99  |     await expect(page.locator('td span', { hasText: 'queued' }).first()).toBeVisible();
  100 |   });
  101 | });
  102 | 
```