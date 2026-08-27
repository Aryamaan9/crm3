# Project Operational Rules

These are the three unbreakable commandments for this codebase, designed to keep development fast, clean, and easily hand-offable to other AI agents or developers.

## 1. Isolation and Modularity
*   **Feature-Driven Architecture**: The codebase will be organized by feature (e.g., `src/features/leads`, `src/features/email`) rather than by technical type (`src/components`, `src/hooks`). 
*   **Non-Coder Friendly**: A non-coder should be able to look at the folder structure and immediately understand where a feature lives.
*   **Self-Contained**: Each feature should manage its own UI, state, and API logic to prevent spaghetti code.

## 2. Complete, Working, and Tested Features
*   **No Skeletons**: A feature is not done until it works end-to-end. If we add a button, the click handler, loading state, error handling, API call, and database update must be implemented.
*   **Validation**: Every feature must be tested for edge cases (e.g., Firebase permission errors, empty states) before moving to the next task.

## 3. Strict Documentation & Handoff Logs
*   **Continuous Logging**: Everything we do must be logged.
*   **`CHANGELOG.md`**: Tracks granular technical changes, bug fixes, and additions.
*   **`PROJECT_STATUS.md`**: A high-level view of what is completed, what is in progress, and what is next. This acts as the "save state" so any new AI agent can instantly understand the project context.
