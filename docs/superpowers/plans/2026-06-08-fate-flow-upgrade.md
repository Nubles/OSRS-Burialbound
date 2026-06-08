# Fate Flow Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporate the useful flow patterns from Fate Locked into Burialbound without changing Burialbound's ritual-ledger identity.

**Architecture:** Keep the client-only React/Vite app and extend the existing localStorage state. Add onboarding, a tabbed command center, reveal feedback, next-up guidance, backup metadata, and a compact built-in codex using the existing `App.tsx`, `state.ts`, `types.ts`, and `styles.css` structure.

**Tech Stack:** React, TypeScript, Vite, localStorage, CSS.

---

### Task 1: State Flow Fields

**Files:**
- Modify: `src/types.ts`
- Modify: `src/state.ts`

- [ ] Add onboarding, active tab, animations, backup records, and last reveal fields to `RunState`.
- [ ] Add helper functions to create backup snapshots before reset/import.
- [ ] Hydrate missing fields from older saves so existing ledgers load safely.

### Task 2: Command Center UI

**Files:**
- Modify: `src/App.tsx`

- [ ] Add an onboarding modal that explains the Burialbound loop.
- [ ] Add a sticky command header with live resources and controls.
- [ ] Add a next-up strip for ready rites, active breaches, and pending work.
- [ ] Replace the always-visible full page with tabs: Draft, Rite, Registers, Archive, Codex.
- [ ] Add reveal overlays when rites are generated and buried.

### Task 3: Styling and Docs

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`

- [ ] Style the command center tabs, onboarding modal, reveal overlay, backup list, and codex cards.
- [ ] Update documentation to describe the improved Fate Locked-inspired flow.

### Task 4: Verify and Publish

**Files:**
- Read: `package.json`

- [ ] Run `npm run build`.
- [ ] Run Vite preview at `/OSRS-Burialbound/` and confirm HTTP 200.
- [ ] Commit and push `main`.
