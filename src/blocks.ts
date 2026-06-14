/**
 * The nine building blocks of the Business Model Canvas
 * (Osterwalder & Pigneur). Each block maps to one `##` heading in the
 * backing markdown file. `aliases` lets us recognise common variant
 * spellings when matching existing headings (case-insensitive).
 */

export type BlockId =
  | "key-partners"
  | "key-activities"
  | "key-resources"
  | "value-propositions"
  | "customer-relationships"
  | "channels"
  | "customer-segments"
  | "cost-structure"
  | "revenue-streams";

export interface BlockDef {
  id: BlockId;
  /** Canonical heading text written to markdown. */
  title: string;
  /** Lower-cased alternative headings we also accept on parse. */
  aliases: string[];
  /** CSS grid-area name (see styles.css). */
  area: string;
}

export const BLOCKS: BlockDef[] = [
  {
    id: "key-partners",
    title: "Key Partners",
    aliases: ["key partnerships", "partners", "partnerships"],
    area: "kp",
  },
  {
    id: "key-activities",
    title: "Key Activities",
    aliases: ["activities"],
    area: "ka",
  },
  {
    id: "key-resources",
    title: "Key Resources",
    aliases: ["resources"],
    area: "kr",
  },
  {
    id: "value-propositions",
    title: "Value Propositions",
    aliases: ["value proposition", "value props", "value prop"],
    area: "vp",
  },
  {
    id: "customer-relationships",
    title: "Customer Relationships",
    aliases: ["relationships", "customer relationship"],
    area: "cr",
  },
  {
    id: "channels",
    title: "Channels",
    aliases: ["channel"],
    area: "ch",
  },
  {
    id: "customer-segments",
    title: "Customer Segments",
    aliases: ["segments", "customer segment", "customers"],
    area: "cs",
  },
  {
    id: "cost-structure",
    title: "Cost Structure",
    aliases: ["costs", "cost"],
    area: "cost",
  },
  {
    id: "revenue-streams",
    title: "Revenue Streams",
    aliases: ["revenue", "revenue stream"],
    area: "rev",
  },
];

export const BLOCK_IDS: BlockId[] = BLOCKS.map((b) => b.id);

const TITLE_LOOKUP: Map<string, BlockId> = new Map(
  BLOCKS.flatMap((b) => [
    [b.title.toLowerCase(), b.id] as const,
    ...b.aliases.map((a) => [a, b.id] as const),
  ]),
);

/** Resolve a heading string to a canonical block id, or null if unknown. */
export function blockIdForHeading(heading: string): BlockId | null {
  return TITLE_LOOKUP.get(heading.trim().toLowerCase()) ?? null;
}

export function blockDef(id: BlockId): BlockDef {
  const def = BLOCKS.find((b) => b.id === id);
  if (!def) throw new Error(`Unknown block id: ${id}`);
  return def;
}
