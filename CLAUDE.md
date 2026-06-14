# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An Obsidian plugin that renders a markdown file as a nine-block
[Business Model Canvas](https://en.wikipedia.org/wiki/Business_model_canvas).
The canvas is just a different lens on a plain `.md` file: each block is a `##`
heading, each sticky note a top-level bullet. Every edit is written straight
back to the markdown.

## Commands

```bash
npm install
npm run dev       # esbuild watch build → main.js
npm run build     # production build (no sourcemap)
npm test          # vitest run (all tests)
npx vitest run src/canvas-parser.test.ts   # single test file
npx vitest                                  # watch mode
```

There is no separate lint step; `tsc` settings live in `tsconfig.json` but are
enforced via the esbuild/Svelte pipeline rather than a standalone typecheck
script. This is a Nix project — `direnv reload` activates the dev shell
(`flake.nix` provides nodejs_22, pnpm, esbuild). Version control is **jujutsu**
(`.jj/` present): describe changes with `jj desc -m "..."`.

## Architecture

The codebase splits cleanly into **pure logic** and **Obsidian/Svelte glue**.
Keep that boundary intact: all markdown reading/writing logic stays pure and
unit-tested; only the glue touches the Obsidian API.

### Pure core (unit-tested, no Obsidian imports)

- `src/blocks.ts` — the nine `BlockDef`s: canonical title, heading `aliases`
  (matched case-insensitively on parse), and CSS `area` name. Single source of
  truth for block identity, ordering, and heading resolution
  (`blockIdForHeading`).
- `src/canvas-parser.ts` — the heart of the plugin. `parseCanvas` turns
  markdown into a `ParsedCanvas` (nine `ParsedBlock`s, each tracking its
  heading line and items with **source line numbers**). The mutators
  (`addItem`, `updateItem`, `deleteItem`, `moveItem`, `emptyCanvasMarkdown`)
  are pure `string -> string` functions. They re-parse, then splice the
  specific source lines — so unrecognised headings, nested bullets, and fenced
  code blocks are preserved untouched. `canvas-parser.test.ts` covers these.

Key invariants the parser upholds (don't break these): only **top-level**
(un-indented) bullets are items; content inside ``` / ~~~ fences is never
parsed; an empty item text deletes the item (`updateItem` delegates to
`deleteItem`).

### Obsidian + Svelte glue

- `src/main.ts` — `Plugin` subclass. Registers the view, two commands
  (open-as-canvas, create-canvas), and the file-menu entry. `onunload`
  deliberately does **not** detach leaves, so hot-reload preserves open panes.
- `src/canvas-view.svelte.ts` — `ItemView` (`VIEW_TYPE_BMC`). Persists the
  backing file via `getState`/`setState`, and bumps a `fileVersion` counter on
  vault `modify` events to signal the Svelte app to re-read. Mounts Svelte 5
  via `createClassComponent` from `svelte/legacy`.
- `src/components/CanvasApp.svelte` — top-level Svelte component. Reads the file
  (`vault.cachedRead`), holds the `ParsedCanvas` in `$state.raw`, and routes all
  edits through `edit()`, which calls `vault.process` (atomic) then reloads.
  Re-parses when `fileVersion` changes.
- `src/components/Block.svelte` — one block's UI: inline editing, add field,
  delete. Enter commits, Esc cancels, empty commit deletes.
- `src/components/render-markdown.ts` — a Svelte `use:` action wrapping
  Obsidian's `MarkdownRenderer` so note text renders as real markdown.

### Data flow

`markdown file → parseCanvas → ParsedCanvas → Svelte UI → pure mutator →
vault.process writes file → modify event → fileVersion++ → reload`.

The round-trip through the file (rather than mutating in-memory state directly)
is intentional: the markdown file is the single source of truth.

## Conventions

- Svelte 5 runes only (`$props`, `$state`, `$state.raw`, `$effect`). View glue
  uses the legacy `createClassComponent` mount path because it lives inside an
  Obsidian `ItemView`.
- Styling is CSS grid via `styles.css`, keyed by the `area` field in
  `blocks.ts`. To change the layout, edit both together.
- `esbuild.config.mjs` bundles `src/main.ts → main.js` (the built artifact, and
  `manifest.json`, are what Obsidian loads). `obsidian`, `electron`, and the
  CodeMirror/Lezer packages are marked external.
