# Project Status

This document tracks the phased implementation of the Asset Management CRM. Every feature will be built completely (UI, State, Logic, DB) before moving to the next.

## Phase 1: Foundation (Completed)
- [x] Scaffold Next.js (App Router, Tailwind, TypeScript)
- [x] Install dependencies (Firebase, Lucide, UI utils)
- [x] Initialize Firebase configuration & Auth context
- [x] Build global Layout (Sidebar navigation)

## Phase 2: Authentication & Settings (Completed)
- [x] Login screen and Auth state persistence
- [x] Settings Page (Manage dynamic Lead Stages and Investor Types)
- [x] Enforce 3-Tier RBAC (Admin, Senior, Junior)

## Phase 3: Core Leads & Pipeline (Completed)
- [x] Leads Table (Search, Filter by Stage/Type, RBAC enforcement)
- [x] Add/Edit Lead Modal (Full validation and Firestore integration)
- [x] Pipeline Kanban Board (Drag/drop or select stages)

## Phase 4: Distributors & Follow-ups (Completed)
- [x] Distributors Table (Add/Edit partners)
- [x] Link Leads to Distributors (Prepared schema)
- [x] Follow-ups Dashboard (Querying Overdue, Today, Upcoming)

## Phase 5: Email Automation (Completed)
- [x] Audience Builder (Select leads based on filters)
- [x] Email Composer (Subject, Body with variables)
- [x] Brevo Queue Worker (Firestore -> Brevo API pseudo-endpoint)

## Phase 6: Dashboard & Polish (Completed)
- [x] Dashboard analytics (Total Leads, Conversion Rates)
- [x] Charts (Pipeline distribution, Investor Types)
- [x] Final UI/UX polish and edge-case testing
