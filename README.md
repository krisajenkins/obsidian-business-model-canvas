# Business Model Canvas for Obsidian

Edit a [Business Model Canvas](https://en.wikipedia.org/wiki/Business_model_canvas)
(Osterwalder & Pigneur) as a nine-block grid, backed by a **plain markdown file**.

Each of the nine blocks maps to a `##` heading; each sticky-note item is a
top-level bullet. The file stays perfectly readable (and editable) as ordinary
markdown — the canvas view is just a different lens on the same `.md`.

```
┌──────────────┬───────────────┬──────────────┬────────────────┬──────────────┐
│              │ Key Activities│              │ Cust. Relations│              │
│ Key Partners ├───────────────│  Value Props ├────────────────│ Cust.Segments│
│              │ Key Resources │              │    Channels    │              │
├──────────────┴───────────────┼────────────────┴───────────────┴────────────┤
│       Cost Structure         │              Revenue Streams                 │
└──────────────────────────────┴──────────────────────────────────────────────┘
```

## Usage

- **Open current file as canvas** — command palette, or right-click a `.md`
  file → _Open as Business Model Canvas_.
- **Create new Business Model Canvas** — command palette; scaffolds a fresh
  file with all nine empty blocks.

In the canvas view:

- Click a sticky note to edit it; **Enter** commits, **Esc** cancels, an empty
  commit deletes it.
- Type in the dashed _Add…_ field at the bottom of a block and press **Enter**.
- Hover a note and click **×** to delete.

All edits are written straight back to the markdown file.

## Markdown format

```markdown
## Key Partners

- Supplier A
- Distributor B

## Value Propositions

- Fast delivery
```

Headings are matched case-insensitively and accept common aliases (e.g.
"Key Partnerships", "Revenue", "Segments"). Content under unrecognised
headings is left untouched.

## Development

```bash
npm install
npm run dev     # watch build
npm run build   # production build
npm test        # vitest
```

The plugin uses Svelte 5 (runes) for the UI, mounted in an Obsidian `ItemView`
via `createClassComponent`. The markdown parsing and editing logic
(`src/canvas-parser.ts`) is pure and unit-tested.
