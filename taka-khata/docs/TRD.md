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
| Android | Capacitor (`core`, `cli`, `android`, `filesystem`, `share`) | same React app in a native shell, APK built without Android Studio |
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
npm run build         # GitHub Pages build, outputs dist/
npm run build:netlify # Netlify build (mode netlify), outputs dist/
npm run preview       # test the built PWA locally
npm run check:netlify # after build:netlify, checks dist/ uses the root base
```

## Deploy
The Vite `base` depends on where the build is served from, so each host has its own mode and script. `npm run build` must keep the GitHub Pages base.

| Host | Command | `base` | Served from |
|---|---|---|---|
| GitHub Pages | `npm run build` | `/money-management/` | project sub-path |
| Netlify | `npm run build:netlify` (`vite build --mode netlify`) | `/` | site root |
| Android APK | `npm run build:android` (`vite build --mode android`) | `./` | Capacitor web server |
| dev server | `npm run dev` | `/` | local root |
| `npm run preview` | `npm run preview` | `/money-management/` | local sub-path |

- Both web builds keep the PWA. The manifest uses relative `start_url: '.'`, `scope: '.'` and relative icon paths, so it resolves from whichever base was built (`/` on Netlify, `/money-management/` on Pages) without per-host config.
- `scripts/check-netlify-build.mjs` (`npm run check:netlify`) fails when `dist/index.html`, `dist/manifest.webmanifest` or `dist/sw.js` still contain `/money-management/`, or when the entry script is not root-absolute. Run it after `npm run build:netlify`.
- Netlify: root `netlify.toml` sets `command = "npm run build:netlify"` and `publish = "dist"`. `HashRouter` means no SPA redirect rule is needed.
- GitHub Pages: upload the *contents* of `dist/` plus an empty `.nojekyll` to the `gh-pages` branch.

## Android build
The same web app ships as an installable Android APK through Capacitor. The web build is unchanged: `npm run build` still uses base `/money-management/` and the PWA service worker. The Android build uses `npm run build:android` (`vite build --mode android`), which sets base `./` and turns VitePWA off because the native shell loads `dist/` from its own web server and must not register a web service worker.

- Native config: `capacitor.config.ts` (appId `com.takakhata.app`, appName `Taka Khata`, webDir `dist`, backgroundColor `#FBF7EF`). Native platform folder: `android/`.
- Export on Android: `<a download>` does not work in a WebView. `src/lib/nativeFile.ts` writes the JSON backup to `Directory.Cache` with `@capacitor/filesystem` and opens the system share sheet with `@capacitor/share`; on the web it keeps the existing Blob download.
- Signing: `android/app/takakhata.keystore` is local-only and ignored by Git; release APKs must use the same PKCS12 key so Android can install updates over the existing app. Configure the GitHub repository secrets `ANDROID_KEYSTORE_BASE64` (base64-encoded keystore), `TAKAKHATA_STORE_PASSWORD`, `TAKAKHATA_KEY_ALIAS` and `TAKAKHATA_KEY_PASSWORD` for CI. For local release builds, provide the keystore at that path and set the three `TAKAKHATA_*` environment variables. Never commit the keystore or its credentials.
- CI: `.github/workflows/android-apk.yml` (repo root) runs on `workflow_dispatch`, pushes to `main` and `v*` tags: **Node 22** (`actions/setup-node@v4`), **Java 21 temurin** (`actions/setup-java@v4`), `android-actions/setup-android@v3`, `npm ci`, `npm test`, `npm run build:android`, `npx cap sync android`, then `./gradlew assembleRelease`, and uploads `app-release.apk` as the `taka-khata-apk` artifact. Tags starting with `v` also attach the APK to a GitHub Release. It does not touch the `gh-pages` branch, so Pages deployment keeps working.
- The two toolchain versions are not free choices: `android/app/capacitor.build.gradle` compiles with `JavaVersion.VERSION_21` (Capacitor 7 + Gradle 8.11), and `vitest@5` requires Node `^22.12.0` while `jsdom@30` requires `^22.22.2`, so the workflow cannot use Node 20. The `android/.gitignore` from the Capacitor template ignores `*.apk`, `build/`, `.gradle/`, `local.properties`, the copied `app/src/main/assets/public`, and signing keystores.
- Icons/splash: `python scripts/generate-icons.py` writes the PWA icons into `public/icons/` **and** the Capacitor sources `assets/icon.png` (1024x1024) and `assets/splash.png` (2732x2732, paper `#FBF7EF`); `npx capacitor-assets generate --android` turns those into the adaptive launcher icons and every splash density (87 resources).

## package.json scripts (exact)
```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "build:android": "tsc --noEmit && vite build --mode android",
  "build:netlify": "tsc --noEmit && vite build --mode netlify",
  "check:netlify": "node scripts/check-netlify-build.mjs",
  "preview": "vite preview",
  "test": "vitest run",
  "typecheck": "tsc --noEmit"
}
```
