<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CRM Architecture & Best Practices

## React-Datasheet-Grid & Firestore Sync (Excel Mode)
- **Stale Closures:** The `handleChange` callback in `react-datasheet-grid` provides the entire grid data on every cell change. Rapid cell edits can cause partial updates to fail if the callback references an old, stale state closure. **Always bind diff checks against a `useRef` of the data array** to guarantee you are comparing against the most instantaneous state.
- **ID Collisions on Copy/Paste:** Dragging-to-fill or copy-pasting rows clones the exact row object, including its hidden Firestore `id`. When two rows share an `id`, updates collide and deletions fail. **Always add a deduplication sweep** inside the grid's change handler to strip `id`s from cloned rows so they are treated as brand-new records.
- **Optimistic IDs:** When adding a new row, generate an ID instantly (e.g., `doc(collection(db, "leads")).id`) *before* saving it to local state, avoiding duplicate `addDoc` calls on subsequent rapid edits.

## UI Components & Structure
- **CSV Imports:** DO NOT write raw or blind CSV mapping logic. Use the existing `<ImportMapperModal>` component which handles UI for field-mapping dropdowns and automatically detects data types for new CRM custom fields.
- **Table Filters:** DO NOT build generic text box filters for table columns. Use the existing `<LeadFilterMenu>` component which acts as an Excel-style popover offering text search, A-Z sorting, and unique-value checkboxes for column filtering.

## Playwright E2E Testing
- **Input Locators:** When writing tests for custom modal forms (like `AddLeadModal`), do not assume inputs have `placeholder` attributes or strict `id`/`htmlFor` bindings unless verified. 
- **Robust Selectors:** If an input immediately follows its label (e.g., `<div><label>Name</label><input type="text"/></div>`), use precise adjacent sibling CSS selectors: `page.locator('label:has-text("Name") + input')` to avoid strict mode violations and timeouts.
