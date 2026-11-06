# Taka Khata: Agent Instructions

Taka Khata is a simple, offline-first phone app (PWA) where one person records money received and money spent, and always sees how much money should be left.

## Source of truth
The blueprint in `/docs` is locked. Do not change the schema, routes, state machine, stack or UI spec on your own.
If something is missing or seems wrong, STOP and ask the user. Never guess or invent.

Read only what the current task needs:
- Always: this file, `docs/Plan.md` (current phase only), `HANDOFF.md`
- Data/money logic: `docs/Schema.md`
- Screens/navigation: `docs/AppFlow.md`, `docs/UI_Spec.md`
- Stack, folders, tests: `docs/TRD.md`
- Product questions: `docs/PRD.md`

## Rule 1: Architecture first, never guess
- Use field names from Schema.md and routes/states from AppFlow.md exactly.
- No new dependency, table, route or feature unless it is in the docs or the user approves.
- Items under "Non-goals" in PRD.md must not be built (no login, no cloud, no bill splitting).

## Rule 2: Test-driven loop
For every task in Plan.md:
1. Write the unit test first.
2. Run `npm test` and confirm it FAILS for the right reason.
3. Write the minimum code to pass.
4. Run again. If it fails, read the error, fix, rerun.
5. After 3 failed attempts on the same error, stop and report the error and what you tried.
6. When green, run `npm test` (all) and `npm run typecheck`, then tick the task in Plan.md.
Never delete or weaken a test to make it pass. Pure money/date logic must have tests. UI tasks need at least one component test for the main behavior.

## Rule 3: Context hygiene
- One phase per session. Do only the tasks the user names.
- Do not touch unrelated files or "improve" things not asked for.
- Read specific files/lines, do not dump big files into chat.
- At the end of every session update `HANDOFF.md`.

## Commands
- Install: `npm install`
- Run: `npm run dev`
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

## Code conventions
- TypeScript strict mode. No `any`.
- Money is always stored as integer poisha (`amountMinor`). Only `src/lib/money.ts` converts to/from display values. Never use floating point for sums.
- Dates are local `YYYY-MM-DD` strings. Only `src/lib/dates.ts` creates or parses them.
- All user-facing text comes from `src/i18n/bn.ts` and `src/i18n/en.ts`. No hard-coded strings in components. Both files must have identical keys.
- Components are small function components, one per file. Styling uses CSS variables from `src/styles/tokens.css`. No inline hex colors.
- Database access only through `src/data/repo.ts`. Components never call Dexie directly.
- Tap targets at least 48px. Text at least 16px.

## Definition of done
Test written first, test passes, full suite passes, typecheck passes, Plan.md ticked, HANDOFF.md updated.
