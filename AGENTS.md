# AGENTS.md

## Shared Context

Before implementation work, read:
- `C:\Users\luzia\OneDrive\Claude-Cowork\AI-CONTEXT.md`
- `C:\Users\luzia\OneDrive\Claude-Cowork\memory\current-focus.md` when continuity matters
- `C:\Users\luzia\OneDrive\Claude-Cowork\projects\metadata-crosswalk-status.md`
- `C:\Users\luzia\OneDrive\Knowledge vault\01_Projects\metadata-crosswalk-visualizer.md`

## Project Role

Metadata standards mapping and crosswalk visualization tool. This project should preserve cataloguing, metadata, and standards terminology carefully.

## Source Of Truth

- Code: this repository.
- Project status: `C:\Users\luzia\OneDrive\Claude-Cowork\projects\metadata-crosswalk-status.md`.
- Durable project knowledge: `C:\Users\luzia\OneDrive\Knowledge vault\01_Projects\metadata-crosswalk-visualizer.md`.
- Active registry row: `C:\Users\luzia\OneDrive\Claude-Cowork\projects\active-projects.md`.

## Commands

- `npm run dev`
- `npm run build`
- `npm run preview`

## Working Rules

- Preserve existing uncommitted user changes.
- Do not delete files; move retired material to an archive folder with a dated name.
- Resolve the canonical component path before broad refactors; the current status file tracks this as a blocker.
- Keep generated dependencies and caches out of OneDrive.
- After meaningful changes, update the Claude-Cowork project status or session log so Hub/Codex/Claude can retrieve the current state.

## Validation

Run `npm run build` after implementation changes that affect source code, configuration, or mapping logic.
