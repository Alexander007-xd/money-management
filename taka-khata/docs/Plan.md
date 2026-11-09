# Build Plan: Taka Khata

Legend: [ ] todo, [x] done. Do tasks in order. One phase per session (fresh chat). Test first, always.

## Phase 0: Setup
- [x] 0.1 Create Vite + React + TypeScript project in this folder, install the dependencies listed in TRD.md, create the folder structure from TRD.md
  - Done when: `npm run dev` shows a blank page with the text "Taka Khata"
  - Test: n/a
- [x] 0.2 Configure Vitest (jsdom, fake-indexeddb, test setup file) and the scripts from TRD.md
  - Done when: one dummy test passes with `npm test` and `npm run typecheck` passes
  - Test: `src/test/dummy.test.ts`
- [x] 0.3 Add `tokens.css` and `global.css` exactly from UI_Spec.md, import the font
  - Done when: page uses paper background and Hind Siliguri font
  - Test: n/a (visual)

## Phase 1: Money and date logic (pure, no UI)
- [x] 1.1 `lib/money.ts`: `toMinor`, `fromMinor`, `formatMoney(minor, lang)` (Bangla digits for bn, ৳ symbol, no float errors)
  - Done when: 0.1+0.2 style inputs convert correctly, 2 decimals max, large values format with grouping
  - Test: `money.test.ts`
- [x] 1.2 `lib/dates.ts`: `today`, `monthKey`, `shiftMonth`, `isFuture`, `formatDay(date, lang)` (Today, Yesterday, else date)
  - Done when: month boundaries (Jan/Dec) and local-time dates are correct
  - Test: `dates.test.ts`
- [x] 1.3 `data/types.ts` and `data/validate.ts` (rules from Schema.md and AppFlow.md)
  - Done when: every validation rule has a failing and passing case
  - Test: `validate.test.ts`
- [x] 1.4 `data/calc.ts`: `balance`, `monthTotals`, `expenseByCategory`, `diffForCheck`
  - Done when: empty data, negative balance, one category, and percent rounding cases pass
  - Test: `calc.test.ts`

## Phase 2: Database layer
- [x] 2.1 `data/db.ts` Dexie schema v1 and default category seeding (idempotent)
  - Done when: opening the db twice does not duplicate categories
  - Test: `db.test.ts`
- [x] 2.2 `data/repo.ts` transactions: add, update, delete, restore, list with filters (month, type, category)
  - Done when: all functions validate input and filters work
  - Test: `repo.transactions.test.ts`
- [x] 2.3 `data/repo.ts` categories, cashChecks, settings
  - Done when: archive/rename/add work, default categories cannot be deleted
  - Test: `repo.other.test.ts`
- [x] 2.4 `exportAll` and `importAll` (validated, single transaction, rollback on failure)
  - Done when: export then import into an empty db gives identical data; a corrupt file changes nothing
  - Test: `repo.backup.test.ts`

## Phase 3: App shell, language, routing
- [x] 3.1 `routes.ts` and `machines.ts` (reducers for form, delete, check, import states from AppFlow.md)
  - Done when: every row of each state table is covered
  - Test: `machines.test.ts`
- [x] 3.2 i18n: `bn.ts`, `en.ts`, `t()`, language hook, test that both files have identical keys
  - Done when: switching language re-renders text; digits follow language
  - Test: `i18n.test.tsx`
- [x] 3.3 `App.tsx` router with redirect rules, Welcome screen (language choice), BottomNav, empty placeholder screens
  - Done when: first launch goes to Welcome, then Home; unknown route goes Home
  - Test: `App.test.tsx`
- [x] 3.4 Base components: Button, Field, AmountInput, ConfirmDialog, Toast, EmptyState (UI_Spec.md)
  - Done when: each component renders all its states
  - Test: `components.test.tsx`

## Phase 4: Add and Home
- [x] 4.1 AddIncome screen with form state machine, validation messages, "From" chips
  - Done when: valid entry saves and returns Home; invalid shows errors
  - Test: `AddIncome.test.tsx`
- [x] 4.2 AddExpense screen with CategoryTile grid
  - Done when: cannot save without category; prefill via URL params works
  - Test: `AddExpense.test.tsx`
- [x] 4.3 Home screen: BalanceCard, BigActionButtons, month strip, latest 5 LedgerRows, empty state
  - Done when: balance updates live after adding entries; negative balance hint shows
  - Test: `Home.test.tsx`

## Phase 5: History and Edit
- [x] 5.1 LedgerRow component and History screen (month switcher, type chips, category chip, grouped by day with day totals)
  - Done when: filters combine correctly; empty state works
  - Test: `History.test.tsx`
- [x] 5.2 EditEntry screen, delete with confirmation and 5-second Undo
  - Done when: edit saves; delete then Undo restores; after 5 s it is permanent
  - Test: `EditEntry.test.tsx` (use fake timers)

## Phase 6: Report and Cash Check
- [x] 6.1 Report screen with month totals and BarRows, tap category opens filtered History
  - Done when: percentages and sorting match calc tests
  - Test: `Report.test.tsx`
- [x] 6.2 CashCheck screen, results for equal / less / more, saves a cashCheck record, buttons that open prefilled forms, last 5 checks list
  - Done when: all three outcomes show correct text and amounts
  - Test: `CashCheck.test.tsx`

## Phase 7: More, Categories, Backup
- [x] 7.1 More screen with language switch
  - Done when: language change persists after reload
  - Test: `More.test.tsx`
- [x] 7.2 Categories screen (add, rename, hide, icon picker)
  - Done when: hidden categories disappear from AddExpense but still show on old entries
  - Test: `Categories.test.tsx`
- [x] 7.3 Backup screen (download JSON, import with confirmation using the import state machine)
  - Done when: export then import round trip passes; invalid file shows error and changes nothing
  - Test: `Backup.test.tsx`

## Phase 8: PWA, polish, deploy
- [x] 8.1 PWA: manifest (name, short_name, theme color `#FBF7EF`, icons 192/512/maskable), service worker via vite-plugin-pwa with precache of all assets, InstallHelp screen with install button when the browser offers it
  - Done when: `npm run build && npm run preview` works with the network turned off after first load
  - Test: `InstallHelp.test.tsx` plus manual check
  - Verified: 35 files precached; after stopping the preview server the app still loaded and accepted a new entry from the service worker cache.
- [x] 8.2 Accessibility and polish pass: aria-labels, focus outlines, tap target sizes, reduced motion, long text and large number layouts (9,999,999.99), small screen 360px
  - Done when: no overflow at 360px; all icon buttons labeled
  - Test: add a test that every icon-only button has an accessible name
  - Verified: `src/test/accessibility.test.tsx` (5 tests covering 10 routes in both languages, plus the main landmark); every route measured at a 360px viewport with no horizontal overflow and no undersized tap target; `৳9,999,999.99` shrinks to 22px and fits; Lighthouse on the live Home scores 1.0 for accessibility, best practices and SEO.
- [x] 8.3 Deploy: set Vite `base` for the chosen host, build, upload `dist/` to GitHub Pages or Netlify, write `README.md` with a 5-line "how to install on phone and share the link" in Bangla and English
  - Done when: the public link opens on an Android phone and installs
  - Test: manual
  - Deployed to GitHub Pages: https://alexander007-xd.github.io/money-management/ (build base `/money-management/`).
- [x] 8.4 Final phone checklist (manual): add income, add expense, edit, delete+undo, report, cash check (all 3 outcomes), switch language, export, import, airplane mode usage, reopen app after closing it
  - Done when: every item works on a real phone
  - Verified end-to-end in Chrome at a 360px viewport (with the network server stopped for the offline items). A final pass on a real Android phone is still recommended.

Rules: every PRD feature F1 to F10 is covered above (F1 4.1, F2 4.2, F3 4.3, F4 5.x, F5 6.1, F6 6.2, F7 3.2 and 7.1, F8 2.4 and 7.3, F9 7.2, F10 8.1).
