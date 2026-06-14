<script lang="ts">
  import type { App } from "obsidian";
  import { renderMarkdown } from "./render-markdown";
  import type { ParsedBlock } from "../canvas-parser";

  interface Props {
    app: App;
    sourcePath: string;
    area: string;
    title: string;
    block: ParsedBlock;
    onadd?: (text: string) => void;
    onupdate?: (index: number, text: string) => void;
    ondelete?: (index: number) => void;
  }

  let { app, sourcePath, area, title, block, onadd, onupdate, ondelete }: Props =
    $props();

  let editingIndex = $state<number | null>(null);
  let draft = $state("");
  let adding = $state("");

  function startEdit(index: number, text: string) {
    editingIndex = index;
    draft = text;
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const idx = editingIndex;
    const text = draft;
    editingIndex = null;
    draft = "";
    onupdate?.(idx, text);
  }

  function cancelEdit() {
    editingIndex = null;
    draft = "";
  }

  function handleEditKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  }

  function commitAdd() {
    const text = adding.trim();
    adding = "";
    if (text !== "") onadd?.(text);
  }

  function handleAddKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitAdd();
    } else if (e.key === "Escape") {
      adding = "";
      (e.currentTarget as HTMLInputElement).blur();
    }
  }
</script>

<section class="bmc-block" style="grid-area: {area};">
  <header class="bmc-block-title">{title}</header>

  <div class="bmc-items">
    {#each block.items as item, index (index)}
      {#if editingIndex === index}
        <!-- svelte-ignore a11y_autofocus -->
        <input
          class="bmc-item-edit"
          bind:value={draft}
          onkeydown={handleEditKey}
          onblur={commitEdit}
          autofocus
        />
      {:else}
        <div class="bmc-item">
          <div
            class="bmc-item-text"
            role="button"
            tabindex="0"
            onclick={() => startEdit(index, item.text)}
            onkeydown={(e) => {
              if (e.key === "Enter") startEdit(index, item.text);
            }}
            use:renderMarkdown={{ app, markdown: item.text, sourcePath }}
          ></div>
          <button
            class="bmc-item-delete"
            aria-label="Delete item"
            onclick={() => ondelete?.(index)}>×</button
          >
        </div>
      {/if}
    {/each}
  </div>

  <input
    class="bmc-add"
    placeholder="Add…"
    bind:value={adding}
    onkeydown={handleAddKey}
    onblur={commitAdd}
  />
</section>
