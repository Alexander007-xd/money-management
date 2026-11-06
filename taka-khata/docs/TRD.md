# TRD: Taka Khata

## Stack
| Part | Choice | Reason |
|---|---|---|
| Language | TypeScript (strict) | fewer AI mistakes, typed schema |
| Build | Vite | fast, simple |
| UI | React 18 | well known by coding agents |
| Routing | react-router-dom v6 with `HashRouter` | works on any static host, no server rules |
| Storage | Dexie (IndexedDB) | offline, simple API, transactions |
| PWA | vite-plugin-pwa | manifest + service worker + offline cache |
| Icons | lucide-react | line icons, tree-shaken |
| Font | @fontsource/hind-siliguri | Bangla + English, bundled so it works offline |
| Tests | Vitest + @testing-library/react + @testing-library/user-event + fake-indexeddb + jsdom | fast, runs in terminal |
| Styling | Plain CSS with CSS variables (`tokens.css`) | no extra tooling |

No other runtime dependencies without user approval. No chart library, no UI kit, no state library (use React state + a small `useLiveQuery` from `dexie-react-hooks`, which is also allowed).

## Architecture
```
UI (components, screens)
   -> hooks (useTransactions, useBalance, useLanguage)
      -> data/repo.ts (only place that touches Dexie)
         -> data/db.ts (Dexie schema)
   -> data/calc.ts (pure functions on arrays)
   -> lib/money.ts, lib/dates.ts (pure helpers)
   -> i18n (bn.ts, en.ts, t() helper)
```
Rules: screens never import Dexie. `calc.ts`, `money.ts`, `dates.ts`, `machines.ts` are pure (no I/O) so they are cheap to test.

## Folder structure
```
taka-khata/
├── AGENTS.md
├── HANDOFF.md
├── prompts.md
├── docs/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── icons/                 PWA icons (192, 512, maskable)
└── src/
    ├── main.tsx               entry, mounts App
    ├── app/
    │   ├── App.tsx            router + redirects
    │   ├── routes.ts          ROUTES constant and state types
    │   └── machines.ts        pure reducers for form/delete/check/import states
    ├── data/
    │   ├── db.ts              Dexie schema + seed
    │   ├── repo.ts            all reads/writes, backup export/import
    │   ├── calc.ts            balance, month totals, category breakdown
    │   └── types.ts           Transaction, Category, CashCheck types
    ├── lib/
    │   ├── money.ts           toMinor, fromMinor, formatMoney
    │   └── dates.ts           today, monthKey, formatDay
    ├── i18n/
    │   ├── bn.ts
    │   ├── en.ts
    │   └── index.ts           t(), useLanguage, digit formatting
    ├── hooks/
    ├── components/            small reusable UI (Button, LedgerRow, ...)
    ├── screens/               one folder per screen
    ├── styles/
    │   ├── tokens.css
    │   └── global.css
    └── test/
        └── setup.ts           jsdom + fake-indexeddb setup
```
Tests sit next to the file they test as `name.test.ts(x)`.

## Data layer approach
Schema.md maps directly to Dexie stores in `db.ts`. `repo.ts` exposes: `addTransaction`, `updateTransaction`, `deleteTransaction`, `restoreTransaction`, `listTransactions(filter)`, `getCategories`, `addCategory`, `updateCategory`, `addCashCheck`, `listCashChecks`, `getSetting`, `setSetting`, `exportAll`, `importAll`. `importAll` runs in one Dexie transaction so a failure changes nothing.

Undo for delete: keep the deleted record in memory for 5 seconds; only call permanent delete after the timer ends (or restore on Undo).

## Error handling
- Repo functions throw typed errors (`ValidationError`, `StorageError`). Screens catch and show translated messages. No silent catch.
- Validation lives in `src/data/validate.ts` (pure) and is used by forms and by import.
- If IndexedDB is unavailable (private mode), show a full-screen message explaining the app needs storage.

## Security and privacy
- No network calls at all after load. No analytics, no tracking, no third-party scripts.
- Treat imported JSON as untrusted: validate every field, cap sizes.
- Never use `dangerouslySetInnerHTML`.

## Test strategy
- Pure logic (money, dates, calc, validate, machines): thorough unit tests including edge cases (decimals, month boundaries, empty data, negative balance, rounding).
- Repo: tests with fake-indexeddb (add, edit, delete, import rollback, seed).
- Screens: component tests for main behavior (add income updates balance, expense needs category, cash check shows correct difference message, language switch changes text).
- Exact commands: `npm test` runs `vitest run`; `npm run typecheck` runs `tsc --noEmit`.
- Manual checklist for phone behavior is in Plan.md Phase 8.

## Performance targets
First load under 200 KB gzipped JS (excluding font files). Home screen interactive in under 1 second on a mid-range Android phone. History list handles 5,000 entries (group by day, render only the visible month).

## Build and run
```
npm install
npm run dev        # local dev server
npm test           # all tests once
npm run typecheck
npm run build      # outputs dist/
npm run preview    # test the built PWA locally
```
Deploy: upload `dist/` to a free static host (GitHub Pages or Netlify). Vite `base` must be set correctly for the host (see Plan.md Phase 8).

## package.json scripts (exact)
```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "typecheck": "tsc --noEmit"
}
```
