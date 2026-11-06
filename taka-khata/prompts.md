# Copyable prompts for OpenCode

Rule: ONE prompt = ONE fresh session. When a phase is done, close the chat, start a new one.

## Phase 0 starter (very first prompt)
```
Read AGENTS.md, HANDOFF.md, docs/Plan.md (Phase 0 only) and docs/TRD.md.
Do Phase 0 tasks only, following the test-driven loop in AGENTS.md.
When done, tick the tasks in docs/Plan.md and update HANDOFF.md. Do not start Phase 1.
If anything is unclear, stop and ask me. Do not guess.
```

## Any later phase (change the number N)
```
Fresh session. Read AGENTS.md, HANDOFF.md and docs/Plan.md.
Do Phase N only. Read only the docs those tasks need.
For each task: write the test first, see it fail, implement, make it pass, run npm test and npm run typecheck, then tick docs/Plan.md.
If blocked or the docs are unclear, stop and ask me. Do not guess.
Finish by updating HANDOFF.md.
```

## Fix a bug
```
Bug: <write what is wrong, what you did, what you expected>.
Read AGENTS.md and only the relevant doc.
First write a failing test that reproduces the bug, then fix it, then run npm test and npm run typecheck.
Do not change the schema or routes. If the fix needs that, stop and tell me.
```

## Add a new feature later
```
I want to add: <feature>. Do NOT write code yet.
First update the docs: PRD.md, AppFlow.md, Schema.md (if data changes), UI_Spec.md (if screens change), Plan.md (new tasks in a new phase).
Show me the doc changes and wait for my approval.
```

## End of phase review
```
Review Phase N against the docs. Check: names match Schema.md and AppFlow.md, nothing out of scope was built, tests are meaningful, no unused code, all strings come from the i18n files.
List the problems only. Do not fix yet.
```
