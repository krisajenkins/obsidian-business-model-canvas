import { BLOCKS, blockDef, blockIdForHeading, type BlockId } from "./blocks";

export interface CanvasItem {
  /** Item text (markdown), without the leading bullet marker. */
  text: string;
  /** 0-based line index of this item in the source document. */
  line: number;
}

export interface ParsedBlock {
  id: BlockId;
  title: string;
  /** True if a matching `##` heading was found in the document. */
  present: boolean;
  /** 0-based line index of the heading, or -1 if absent. */
  headingLine: number;
  items: CanvasItem[];
}

export type ParsedCanvas = Record<BlockId, ParsedBlock>;

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;
const ITEM_RE = /^(\s*)([-*+])\s+(.*)$/;
const BULLET = "- ";

function emptyBlocks(): ParsedCanvas {
  const blocks = {} as ParsedCanvas;
  for (const def of BLOCKS) {
    blocks[def.id] = {
      id: def.id,
      title: def.title,
      present: false,
      headingLine: -1,
      items: [],
    };
  }
  return blocks;
}

/**
 * Parse a markdown document into the nine canvas blocks. Headings that
 * don't match a known block (or its aliases) are ignored, along with any
 * list items beneath them. Only top-level (un-indented) bullets count as
 * items; nested bullets are skipped.
 */
export function parseCanvas(content: string): ParsedCanvas {
  const blocks = emptyBlocks();
  const lines = content.split("\n");

  let current: BlockId | null = null;
  let inFence = false;
  let fenceChar = "";
  let fenceLen = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track fenced code blocks so we never parse their contents.
    if (inFence) {
      if (
        trimmed.length >= fenceLen &&
        [...trimmed].every((c) => c === fenceChar)
      ) {
        inFence = false;
      }
      continue;
    }
    const fenceOpen = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceOpen) {
      fenceChar = fenceOpen[1][0];
      fenceLen = fenceOpen[1].length;
      inFence = true;
      continue;
    }

    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      const id = blockIdForHeading(headingMatch[2]);
      current = id;
      if (id) {
        blocks[id].present = true;
        blocks[id].headingLine = i;
      }
      continue;
    }

    if (current) {
      const itemMatch = ITEM_RE.exec(line);
      if (itemMatch && itemMatch[1].length === 0) {
        blocks[current].items.push({ text: itemMatch[3].trim(), line: i });
      }
    }
  }

  return blocks;
}

/** Markdown for a fresh, empty canvas: the nine headings in canonical order. */
export function emptyCanvasMarkdown(): string {
  return BLOCKS.map((b) => `## ${b.title}\n`).join("\n");
}

/** Move an array element from one index to another, returning a new array. */
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/**
 * Add a new item to a block. If the block's heading doesn't yet exist it
 * is appended to the end of the document. Returns the new document text.
 */
export function addItem(
  content: string,
  blockId: BlockId,
  text: string,
): string {
  const clean = text.trim();
  if (clean === "") return content;

  const parsed = parseCanvas(content);
  const block = parsed[blockId];

  if (!block.present) {
    const def = blockDef(blockId);
    const sep = content === "" ? "" : content.endsWith("\n") ? "\n" : "\n\n";
    return `${content}${sep}## ${def.title}\n${BULLET}${clean}\n`;
  }

  const lines = content.split("\n");
  const insertAt =
    block.items.length > 0
      ? block.items[block.items.length - 1].line + 1
      : block.headingLine + 1;
  lines.splice(insertAt, 0, `${BULLET}${clean}`);
  return lines.join("\n");
}

/** Replace the text of the item at `index` within a block. */
export function updateItem(
  content: string,
  blockId: BlockId,
  index: number,
  text: string,
): string {
  const clean = text.trim();
  if (clean === "") return deleteItem(content, blockId, index);

  const parsed = parseCanvas(content);
  const item = parsed[blockId].items[index];
  if (!item) return content;

  const lines = content.split("\n");
  lines[item.line] = lines[item.line].replace(
    /^(\s*[-*+]\s+).*$/,
    (_m, prefix: string) => `${prefix}${clean}`,
  );
  return lines.join("\n");
}

/** Remove the item at `index` within a block. */
export function deleteItem(
  content: string,
  blockId: BlockId,
  index: number,
): string {
  const parsed = parseCanvas(content);
  const item = parsed[blockId].items[index];
  if (!item) return content;

  const lines = content.split("\n");
  lines.splice(item.line, 1);
  return lines.join("\n");
}

/** Reorder an item within a block (e.g. via drag). */
export function moveItem(
  content: string,
  blockId: BlockId,
  from: number,
  to: number,
): string {
  const parsed = parseCanvas(content);
  const items = parsed[blockId].items;
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return content;
  }

  const lines = content.split("\n");
  const slots = items.map((it) => it.line);
  const rawLines = slots.map((idx) => lines[idx]);
  const reordered = arrayMove(rawLines, from, to);
  slots.forEach((idx, k) => {
    lines[idx] = reordered[k];
  });
  return lines.join("\n");
}
