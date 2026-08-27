# Agent Handover Documentation

Welcome to the **Modern CRM (mscrm3-a777e)** codebase. This document contains everything a new AI Agent needs to know to immediately start contributing to the project without breaking existing functionality.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + Lucide React (Icons)
- **Backend/Database:** Firebase (Firestore + Authentication + Hosting)
- **State Management:** React Context (`AuthContext`)
- **Key Libraries:** 
  - `@hello-pangea/dnd` (for Pipeline Kanban)
  - `recharts` (for Dashboard Analytics)
  - `react-hot-toast` (for global notifications)
  - `playwright` (for E2E testing)

## Database Schema (Firestore)
1. **`users`**
   - Stores user profiles linked to Firebase Auth.
   - Core fields: `uid`, `email`, `role` ("admin" | "senior" | "junior").
2. **`settings/global`**
   - Central configuration document managed by Admins.
   - Core fields: `leadStages` (Array), `investorTypes` (Array), `customFields` (Array of objects `{ id, label, type }`), `emailConfig` (Object).
3. **`leads`**
   - The core CRM entities.
   - Core fields: `firstName`, `lastName`, `email`, `organization`, `leadStage`, `investorType`, `followUpDate` (Timestamp), `primaryOwner` (uid).
   - *Note on Custom Fields*: Any dynamic fields generated via Settings are appended directly onto the lead document root.
4. **`email_queue`**
   - Stores campaigns created in the Email module before dispatch.

## Critical Architectural Quirks
1. **Static Export Mode:** The app uses `output: "export"` in `next.config.ts`. It is deployed exclusively to Firebase Hosting. **Do not** write Server Actions, API Routes, or rely on SSR. Everything must be purely client-side.
2. **TypeScript Constraints:** `ignoreBuildErrors: true` is currently set in `next.config.ts` to allow rapid deployment over Firestore `DocumentData` mapping mismatches.
3. **RBAC Logic:**
   - `admin`: Can edit global Settings, see all leads, manage user roles.
   - `senior`: Can see and edit all leads.
   - `junior`: Can only view/edit leads where `primaryOwner == user.uid`.
4. **Windows Execution:** The host environment is Windows PowerShell. Always prefix node executable commands with `cmd.exe /c "..."` (e.g., `cmd.exe /c "npx playwright test"`).

## Current Core Modules
- **Settings (`/settings`)**: Tabbed interface. Dynamically manages the `customFields` engine which propagates throughout the app.
- **Leads (`/leads`)**: Tabular view. Uses `LeadSlideOver.tsx` for viewing/editing.
- **Pipeline (`/pipeline`)**: Drag-and-drop Kanban board mapping to `leadStage`.
- **Email (`/email`)**: SPA for composing targeted investor updates with live HTML preview and dynamic tag insertion (`{{first_name}}`).
- **Dashboard (`/dashboard`)**: Analytics powered by `recharts`.

## Development Commands
- Local Dev: `cmd.exe /c "npm run dev"`
- Deploy: `cmd.exe /c "npx firebase-tools deploy --only hosting --project mscrm3-a777e"`
- Test: `cmd.exe /c "npx playwright test"`

*End of Handover*
