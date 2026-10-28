# Improvement Backlog (ODD)

Source: codebase audit of 2026-10-28. Each feature document under `odd/tasks/` is self-contained:
`## Specs` (what must be true), `## Tasks` (how it gets done), `## Log` (history and evidence).

Work them in this order. Earlier features unblock or de-risk later ones.

| # | Feature document | Why it comes here | Risk |
|---|------------------|-------------------|------|
| 1 | [deploy-migrations](tasks/deploy-migrations.md) | Production is broken today (`/sugerencias` has no table) | High: data, delivery |
| 2 | [server-side-validation](tasks/server-side-validation.md) | Any client can complete any lesson or crash the action | High: security, data |
| 3 | [session-hardening](tasks/session-hardening.md) | Bearer cookie without flags, spam-open feedback form | High: security |
| 4 | [layout-variant-registry](tasks/layout-variant-registry.md) | Prerequisite for adding any new layout cheaply | Medium |
| 5 | [latam-dvorak-variant](tasks/latam-dvorak-variant.md) | User-requested feature | Medium |
| 6 | [typing-engine-correctness](tasks/typing-engine-correctness.md) | Dead keys, Unicode and async ordering bugs | Medium |
| 7 | [tests-and-ci](tasks/tests-and-ci.md) | No tests or CI exist. Start it alongside #2 | Medium |
| 8 | [accessibility](tasks/accessibility.md) | Keyboard and screen-reader gaps | Low/Medium |
| 9 | [ops-and-cleanup](tasks/ops-and-cleanup.md) | Docker, README, package.json, DB hygiene | Low |

## Conventions

- Branch per feature, Conventional Commits, about 400 changed lines per reviewable slice.
- When a test runner exists, observe a failing test (RED) before writing each fix.
- Check a task off only after its outcome has been observed. Record the commit hash in the task line.
