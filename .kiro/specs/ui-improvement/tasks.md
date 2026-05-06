# Implementation Plan: UI Improvement — Light Theme Overhaul

## Overview

Rewrite `index.css` to a full light theme, migrate dark-class components to inline Tailwind, and fix currency encoding bugs. All changes are in `frontend-app/src/`.

## Tasks

- [x] 1. Rewrite index.css for light theme
  - [x] 1.1 Update body, scrollbar, and base reset to light theme
    - Set `body` background to `#f9fafb`, color to `#111827`
    - Set scrollbar track to `#f1f5f9`, thumb to `#cbd5e1` / hover `#94a3b8`
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Rewrite sidebar and topbar CSS classes to light theme
    - `.sidebar`: white background (`#ffffff`), `border-right: 1px solid #e5e7eb`
    - `.sidebar-logo`, `.sidebar-logo-text`: dark text (`#111827`)
    - `.sidebar-section`: `#9ca3af` label color
    - `.nav-item`: `#374151` text, hover `bg-gray-100`, active `bg-blue-50 text-blue-700`
    - `.nav-badge`: `bg-blue-100 text-blue-700`
    - `.sidebar-footer`: `border-top: 1px solid #e5e7eb`
    - `.topbar`: `background: rgba(255,255,255,0.9)`, `border-bottom: 1px solid #e5e7eb`
    - `.topbar-search`: `bg-gray-100 border-gray-200`, focus `border-blue-500`
    - `.topbar-search input`: `color: #111827`, placeholder `#9ca3af`
    - `.topbar-icon-btn`: `color: #6b7280`, hover `bg-gray-100 text-gray-900`
    - `.dropdown`: white bg, `border-gray-200`, light shadow
    - `.dropdown-item`: `text-gray-700`, hover `bg-gray-50`
    - _Requirements: 1.4, 5.3_

  - [x] 1.3 Rewrite card, stat-card, asset-card, and table CSS classes to light theme
    - `.card`: `bg-white border-gray-200`, light shadow
    - `.card-hover:hover`: `border-blue-300`, subtle lift shadow
    - `.stat-card`: `bg-white border-gray-200`
    - `.stat-value`: `color: #111827`
    - `.stat-label`: `color: #6b7280`
    - `.asset-card`: `bg-white border-gray-200`
    - `.table-wrap`: `bg-white border-gray-200`
    - `.table th`: `color: #6b7280 bg-gray-50`
    - `.table td`: `color: #374151`, `border-bottom: 1px solid #f3f4f6`
    - `.table tbody tr:hover`: `bg-gray-50/70`
    - _Requirements: 1.4, 5.1_

  - [x] 1.4 Rewrite modal, toast, form, button, badge, and utility CSS classes to light theme
    - `.modal-content`: `bg-white border-gray-200`
    - `.modal-header`, `.modal-footer`: `border-gray-100`
    - `.modal-close`: `color: #6b7280`, hover `bg-gray-100 text-gray-900`
    - `.toast`: `bg-white border`, light shadow
    - `.toast-success`: `bg-green-50 border-green-200 text-green-800`
    - `.toast-error`: `bg-red-50 border-red-200 text-red-800`
    - `.toast-info`: `bg-blue-50 border-blue-200 text-blue-800`
    - `.form-input`: `bg-white border-gray-300 text-gray-900`, placeholder `#9ca3af`, focus `border-blue-500 ring-blue-500/20`
    - `.form-select`: same as `.form-input`, update SVG arrow to `#6b7280`
    - `.form-label`: `color: #374151`
    - `.btn` / `.btn-secondary`: `bg-white border-gray-300 text-gray-700`, hover `bg-gray-50`
    - `.btn-primary`: keep indigo, ensure contrast on white bg
    - `.btn-ghost`: hover `bg-gray-100 text-gray-700`
    - `.btn-danger`: keep red tones, adjust for light bg
    - `.badge-*` and `.status-*`: keep semantic colors, ensure readable on white
    - `.skeleton`: `bg-gray-200` shimmer gradient
    - `.chip`: `bg-white border-gray-300 text-gray-600`, hover `border-blue-400 bg-blue-50`
    - `.chip-active`: `bg-blue-100 border-blue-400 text-blue-700`
    - `.empty-state-icon`: `bg-gray-100 border-gray-200 text-gray-400`
    - `.empty-state-title`: `color: #374151`
    - `.empty-state-desc`: `color: #6b7280`
    - `.section-title`: `color: #111827`
    - `.page-title`: `color: #111827`
    - `.divider`: `border-color: #e5e7eb`
    - `.notif-dot`: `border-color: #ffffff`
    - `.muted`: `color: #6b7280`
    - Remove or update `.hero-gradient` to a light radial tint
    - Remove dark zinc alias classes (`.bg-zinc-900`, `.bg-surface-*`, etc.) or remap to light equivalents
    - _Requirements: 1.3, 1.4, 2.3, 2.4_

- [x] 2. Checkpoint — verify index.css compiles and no dark bleed
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Fix dark-class static pages (AboutPage, ContactPage, TermsPage)
  - [x] 3.1 Rewrite AboutPage.tsx with Tailwind light-theme classes
    - Replace `.page-header` div with `<div className="mb-6">`
    - Replace `.page-title` with `<h1 className="text-2xl font-bold text-gray-900 tracking-tight">`
    - Replace `.page-subtitle` with `<p className="text-sm text-gray-500 mt-1">`
    - Replace `.card` with `<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">`
    - Replace `.text-surface-300` with `text-gray-600`
    - _Requirements: 2.1_

  - [x] 3.2 Rewrite ContactPage.tsx with Tailwind light-theme classes
    - Same page-header, page-title, page-subtitle pattern as 3.1
    - Replace `.card` wrapper with `bg-white rounded-2xl border border-gray-200 shadow-sm p-6`
    - Replace `.text-surface-300` with `text-gray-700`, `.text-surface-400` with `text-gray-500`
    - _Requirements: 2.1_

  - [x] 3.3 Rewrite TermsPage.tsx with Tailwind light-theme classes
    - Same page-header pattern as 3.1
    - Replace `.card` wrapper with `bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4`
    - Replace `.section-title` with `<h2 className="text-base font-semibold text-gray-900">`
    - Replace `.text-surface-300` with `text-gray-600`
    - _Requirements: 2.1_

- [x] 4. Fix RentCalculator.tsx dark-theme classes
  - [x] 4.1 Replace all dark surface/primary token classes with Tailwind light-theme classes
    - Outer wrapper: replace `bg-surface-800/60 border-surface-700/50` → `bg-gray-50 border-gray-200`
    - Header icon wrapper: replace `bg-primary-600/20` → `bg-blue-100`, `text-primary-400` → `text-blue-600`
    - Plan name sub-text: replace `text-surface-500` → `text-gray-500`
    - Row labels: replace `text-surface-400` → `text-gray-500`
    - Row values: replace `text-surface-200` → `text-gray-800`
    - Row dividers: replace `border-surface-700/50` → `border-gray-200`
    - Rent Total box: replace `bg-primary-600/10 border-primary-600/20` → `bg-blue-50 border-blue-200`, `text-primary-300` → `text-blue-700`
    - Security Deposit box: replace `bg-surface-700/40 border-surface-600/30` → `bg-emerald-50 border-emerald-200`, `text-emerald-300` → `text-emerald-700`
    - Damage Fee box: keep amber tones, adjust to `bg-amber-50 border-amber-200 text-amber-700`
    - Grand Total border: replace `border-surface-700/50` → `border-gray-200`, text `text-white` → `text-gray-900`
    - _Requirements: 2.2, 6.4_

- [x] 5. Fix Toast.tsx to use inline Tailwind classes
  - [x] 5.1 Replace CSS class map with inline Tailwind class map
    - Remove `toastClass` record that maps to `.toast-success`, `.toast-error`, `.toast-info`
    - Create `toastStyles` record with full Tailwind strings:
      - `success`: `"flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg max-w-sm bg-green-50 border-green-200 text-green-800"`
      - `error`: `"flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg max-w-sm bg-red-50 border-red-200 text-red-800"`
      - `info`: `"flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg max-w-sm bg-blue-50 border-blue-200 text-blue-800"`
    - Update icon colors: success `text-green-600`, error `text-red-500`, info `text-blue-500`
    - Replace `className={\`toast \${toastClass[t.type]}\`}` with `className={toastStyles[t.type]}`
    - Keep `.toast-container` positioning class in index.css (layout only, no color)
    - _Requirements: 2.3, 2.4_

- [x] 6. Fix currency encoding bugs
  - [x] 6.1 Fix ₹ encoding in Plans.tsx (AdminPlansPage)
    - Replace all occurrences of `â‚¹` with the literal `₹` character
    - Affected locations: form labels `(â‚¹)` spans (4 occurrences) and plan card values `â‚¹{p.daily_rate}`, `â‚¹{p.deposit_amount}`, `â‚¹{p.damage_fee}`, `â‚¹{p.daily_fine_rate}/d`
    - _Requirements: 3.1, 3.3_

  - [x] 6.2 Fix ₹ encoding in AssetBookingModal.tsx
    - Replace `â‚¹{plan.daily_rate}/day` and `Deposit: â‚¹{plan.deposit_amount}` in the select option text with `₹`
    - _Requirements: 3.2, 3.3_

- [x] 7. Verify Input component and admin pages (read-only checks)
  - [x] 7.1 Verify Input.tsx renders correctly in light theme
    - Confirm `Input` component uses `bg-white`, `border-gray-300`, dark placeholder, blue focus ring, and red error state
    - No code changes expected; confirm visually via code review
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Verify Categories.tsx, Users.tsx, and Plans.tsx use no dark CSS classes
    - Scan for any remaining `.card`, `.page-title`, `.section-title`, `.text-surface-*` class usage
    - Fix any found occurrences with equivalent Tailwind light-theme classes
    - _Requirements: 5.1, 5.2_

- [x] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm no TypeScript/lint errors via getDiagnostics on all modified files.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are confined to `frontend-app/src/`
- `AppLayout.tsx` and `AdminLayout.tsx` are already light-themed — do not modify
- The `.toast-container` positioning rule in `index.css` can stay; only color rules need updating
- After task 1, the app may look partially broken until tasks 3–5 are complete — this is expected
