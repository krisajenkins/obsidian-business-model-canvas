import { describe, it, expect } from "vitest";
import {
  parseCanvas,
  addItem,
  updateItem,
  deleteItem,
  moveItem,
  emptyCanvasMarkdown,
} from "./canvas-parser";
import { BLOCK_IDS } from "./blocks";

const SAMPLE = `---
title: Acme
---

## Key Partners
- Supplier A
- Distributor B

## Value Propositions
- Fast delivery

## Customer Segments
- SMBs
- Enterprise
`;

describe("parseCanvas", () => {
  it("returns all nine blocks even for an empty document", () => {
    const parsed = parseCanvas("");
    expect(Object.keys(parsed).sort()).toEqual([...BLOCK_IDS].sort());
    for (const id of BLOCK_IDS) {
      expect(parsed[id].present).toBe(false);
      expect(parsed[id].items).toEqual([]);
    }
  });

  it("extracts items under matching headings", () => {
    const parsed = parseCanvas(SAMPLE);
    expect(parsed["key-partners"].present).toBe(true);
    expect(parsed["key-partners"].items.map((i) => i.text)).toEqual([
      "Supplier A",
      "Distributor B",
    ]);
    expect(parsed["customer-segments"].items.map((i) => i.text)).toEqual([
      "SMBs",
      "Enterprise",
    ]);
  });

  it("marks blocks with no heading as absent", () => {
    const parsed = parseCanvas(SAMPLE);
    expect(parsed["revenue-streams"].present).toBe(false);
    expect(parsed["revenue-streams"].items).toEqual([]);
  });

  it("recognises heading aliases case-insensitively", () => {
    const parsed = parseCanvas("## key partnerships\n- X\n## REVENUE\n- Y\n");
    expect(parsed["key-partners"].items.map((i) => i.text)).toEqual(["X"]);
    expect(parsed["revenue-streams"].items.map((i) => i.text)).toEqual(["Y"]);
  });

  it("ignores items under unknown headings", () => {
    const parsed = parseCanvas("## Notes\n- ignore me\n## Channels\n- Web\n");
    expect(parsed["channels"].items.map((i) => i.text)).toEqual(["Web"]);
  });

  it("ignores nested (indented) bullets", () => {
    const parsed = parseCanvas("## Channels\n- Web\n  - sub item\n- App\n");
    expect(parsed["channels"].items.map((i) => i.text)).toEqual(["Web", "App"]);
  });

  it("does not parse bullets inside code fences", () => {
    const parsed = parseCanvas(
      "## Channels\n- Web\n```\n- not an item\n```\n- App\n",
    );
    expect(parsed["channels"].items.map((i) => i.text)).toEqual(["Web", "App"]);
  });

  it("records the source line of each item", () => {
    const parsed = parseCanvas(SAMPLE);
    const a = parsed["key-partners"].items[0];
    expect(SAMPLE.split("\n")[a.line]).toBe("- Supplier A");
  });
});

describe("addItem", () => {
  it("appends to an existing block after its last item", () => {
    const out = addItem(SAMPLE, "key-partners", "Logistics Co");
    const items = parseCanvas(out)["key-partners"].items.map((i) => i.text);
    expect(items).toEqual(["Supplier A", "Distributor B", "Logistics Co"]);
  });

  it("creates the heading for an absent block", () => {
    const out = addItem(SAMPLE, "revenue-streams", "Subscriptions");
    expect(out).toContain("## Revenue Streams");
    expect(
      parseCanvas(out)["revenue-streams"].items.map((i) => i.text),
    ).toEqual(["Subscriptions"]);
  });

  it("adds to a present-but-empty block right after the heading", () => {
    const src = "## Channels\n\n## Cost Structure\n- Servers\n";
    const out = addItem(src, "channels", "Web");
    expect(parseCanvas(out)["channels"].items.map((i) => i.text)).toEqual([
      "Web",
    ]);
    // Cost Structure must be untouched.
    expect(parseCanvas(out)["cost-structure"].items.map((i) => i.text)).toEqual(
      ["Servers"],
    );
  });

  it("ignores blank text", () => {
    expect(addItem(SAMPLE, "channels", "   ")).toBe(SAMPLE);
  });

  it("creates a usable canvas when starting from empty", () => {
    const out = addItem("", "value-propositions", "10x faster");
    expect(
      parseCanvas(out)["value-propositions"].items.map((i) => i.text),
    ).toEqual(["10x faster"]);
  });
});

describe("updateItem", () => {
  it("replaces the text of an item, preserving others", () => {
    const out = updateItem(SAMPLE, "key-partners", 0, "Supplier ACME");
    expect(parseCanvas(out)["key-partners"].items.map((i) => i.text)).toEqual([
      "Supplier ACME",
      "Distributor B",
    ]);
  });

  it("preserves the original bullet marker", () => {
    const src = "## Channels\n* Web\n";
    const out = updateItem(src, "channels", 0, "Website");
    expect(out).toBe("## Channels\n* Website\n");
  });

  it("deletes the item when set to blank text", () => {
    const out = updateItem(SAMPLE, "key-partners", 0, "");
    expect(parseCanvas(out)["key-partners"].items.map((i) => i.text)).toEqual([
      "Distributor B",
    ]);
  });

  it("is a no-op for an out-of-range index", () => {
    expect(updateItem(SAMPLE, "key-partners", 9, "x")).toBe(SAMPLE);
  });
});

describe("deleteItem", () => {
  it("removes the targeted item only", () => {
    const out = deleteItem(SAMPLE, "customer-segments", 0);
    expect(
      parseCanvas(out)["customer-segments"].items.map((i) => i.text),
    ).toEqual(["Enterprise"]);
  });

  it("leaves other blocks untouched", () => {
    const out = deleteItem(SAMPLE, "customer-segments", 0);
    expect(parseCanvas(out)["key-partners"].items).toHaveLength(2);
  });
});

describe("moveItem", () => {
  it("reorders items within a block", () => {
    const out = moveItem(SAMPLE, "key-partners", 0, 1);
    expect(parseCanvas(out)["key-partners"].items.map((i) => i.text)).toEqual([
      "Distributor B",
      "Supplier A",
    ]);
  });

  it("is a no-op when from === to", () => {
    expect(moveItem(SAMPLE, "key-partners", 1, 1)).toBe(SAMPLE);
  });
});

describe("emptyCanvasMarkdown", () => {
  it("produces a document with all nine present-but-empty blocks", () => {
    const parsed = parseCanvas(emptyCanvasMarkdown());
    for (const id of BLOCK_IDS) {
      expect(parsed[id].present).toBe(true);
      expect(parsed[id].items).toEqual([]);
    }
  });
});

describe("round-tripping", () => {
  it("a sequence of edits leaves unrelated content intact", () => {
    let doc = SAMPLE;
    doc = addItem(doc, "channels", "Web store");
    doc = addItem(doc, "key-partners", "Logistics");
    doc = updateItem(doc, "value-propositions", 0, "Same-day delivery");
    doc = deleteItem(doc, "customer-segments", 1);

    expect(doc).toContain("title: Acme"); // frontmatter survives
    const parsed = parseCanvas(doc);
    expect(parsed["channels"].items.map((i) => i.text)).toEqual(["Web store"]);
    expect(parsed["value-propositions"].items.map((i) => i.text)).toEqual([
      "Same-day delivery",
    ]);
    expect(parsed["customer-segments"].items.map((i) => i.text)).toEqual([
      "SMBs",
    ]);
  });
});
