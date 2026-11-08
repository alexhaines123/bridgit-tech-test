# Repository guidance

## GitHub issues

Use the `gh` CLI for issue and spec tracking. Follow `docs/agents/issue-tracker.md` for repo-specific commands and conventions.

## Domain docs

This is a single-context repo: domain docs live in root `GLOSSARY.md` and `docs/adr/`. Follow `docs/agents/domain.md` when exploring domain terms or recording decisions; create these docs lazily.

## Pull requests

Structure PRs with multiple logical commits following the code flow (data → API → UI), not one large commit. See `docs/agents/pr-conventions.md` for the commit ordering pattern and examples.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
