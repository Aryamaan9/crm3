# Goal Description

Resolve core CRM usability and data integrity issues as requested:
1.  **CSV Import Accuracy**: The current import logic blindly assumes column order. We will build a robust Field Mapping UI.
2.  **Filter Intuitiveness**: Replace global text search with Excel-like header dropdown filters (Sorting + Checkboxes).
3.  **Excel Mode Syncing**: Fix granular data loss and deletion bugs caused by race conditions and duplicate row IDs in the grid.
4.  **Comprehensive Testing**: Implement deep E2E testing for all these edge cases.

## User Review Required

Please review the proposed architectural changes below. If you are satisfied with this approach, click **Proceed** so I can begin execution.

## Proposed Changes

---

### UI Components (Import & Filtering)

#### [NEW] `src/components/leads/ImportMapperModal.tsx`
- **Purpose**: Intercepts the uploaded CSV before saving.
- **Workflow**: Displays CSV headers on the left and a dropdown of CRM fields on the right.
- **Auto-Detect**: Automatically detects data types (Text, Number, Date) for "Create New Field" options, allowing the user to override before confirming.

#### [NEW] `src/components/leads/LeadFilterMenu.tsx`
- **Purpose**: Excel-like dropdown menu for table headers.
- **Features**: Sort A-Z/Z-A, text search, and a scrollable list of checkboxes representing unique values in that column.

#### [MODIFY] `src/app/leads/page.tsx`
- **Changes**: 
  - Remove the blind `handleImport` logic and replace it with parsing the CSV into state, triggering the `ImportMapperModal`.
  - Update the standard Leads table header (`<thead>`) to render `LeadFilterMenu` components instead of plain text.

---

### Excel Sync Architecture

#### [MODIFY] `src/components/leads/LeadsDataSheet.tsx`
- **Root Cause Fix 1 (Stale State)**: Change the `onChange` handler to use a `useRef` for tracking the latest `leads` state. This prevents rapid cell edits from overwriting each other due to React closure staleness.
- **Root Cause Fix 2 (Duplicate IDs)**: When rows are copy-pasted or dragged in the grid, the hidden row ID is duplicated. We will add a deduplication step: if an ID appears more than once in `newData`, treat the duplicates as *brand new rows* (strip the ID).
- **Root Cause Fix 3 (Deletion)**: Ensure deletions are processed sequentially and verified against the deduplicated ID set.

---

## Verification Plan

### Automated Tests (Playwright)
- `npx playwright test tests/import.spec.ts`: Simulates uploading a CSV, mapping a mismatched column to a new field, and verifying the new field is created and data is imported.
- `npx playwright test tests/filter.spec.ts`: Clicks a column header, unchecks a value, and ensures the table filters out the unselected rows.
- `npx playwright test tests/excel-sync.spec.ts`: Deep tests for the data sync:
  - Rapidly edits 3 different cells in succession.
  - Drags a cell down to duplicate rows.
  - Deletes a cloned row and verifies the original row remains intact.
