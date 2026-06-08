# Burialbound Full Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Burialbound from a thin prototype into a useful OSRS restrictive-mode companion for planning, approving, and auditing unlocks.

**Architecture:** Keep the Vite React app small and client-only, with localStorage persistence. Expand the model in `src/types.ts`, deepen the rule tables in `src/data/rites.ts`, centralize migration-safe state in `src/state.ts`, and rebuild `src/App.tsx` around a run dashboard, rite engine, ledgers, breaches, and archive.

**Tech Stack:** React, TypeScript, Vite, localStorage, CSS.

---

### Task 1: Expand Mode Data

**Files:**
- Modify: `src/types.ts`
- Modify: `src/data/rites.ts`
- Modify: `src/state.ts`

- [ ] Add run profile fields: account name, account style, strictness, phase, active tab, and seeded example state.
- [ ] Add rite tier, surpassed target, proof note, legal status, generated offerings, generated clauses, penalties, and witness fields.
- [ ] Replace plain breach strings with structured breach records containing severity, penalty, resolution state, and timestamp.
- [ ] Add data tables for unlock tiers, rite templates, offering pools, clause pools, penalties, account phases, and starter examples.
- [ ] Preserve older saved ledgers by hydrating missing fields with defaults.

### Task 2: Build Companion Workflow

**Files:**
- Modify: `src/App.tsx`

- [ ] Add a run setup strip with account name, style, phase, and strict mode.
- [ ] Add a rite generator with unlock type, power tier, unlock name, surpassed target, witness, and proof note.
- [ ] Generate offerings, clauses, and penalties from template plus tier.
- [ ] Show active rite detail with progress, legality state, offering checklist, clause checklist, proof, and approval button.
- [ ] Add legal unlocks, forbidden unlocks, memorial archive, breach register, and run statistics.
- [ ] Add export/import/reset with migration-safe state.

### Task 3: Upgrade Visual Design

**Files:**
- Modify: `src/styles.css`

- [ ] Replace the sparse three-column prototype with a fuller chapel dashboard.
- [ ] Use dark stone navigation, parchment ledger panels, wax-seal status pills, compact ledgers, and clear responsive stacking.
- [ ] Ensure controls have stable dimensions, no overlapping text, and useful empty states.

### Task 4: Verify and Publish

**Files:**
- Read: `package.json`
- Generated: `dist/`

- [ ] Run `npm run build`.
- [ ] Run Vite preview at `/OSRS-Burialbound/` and confirm HTTP 200.
- [ ] Commit the app upgrade.
- [ ] Push `main` to `Nubles/OSRS-Burialbound`.
