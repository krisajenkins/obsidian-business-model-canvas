<script lang="ts">
  import type { App, TFile } from "obsidian";
  import { onMount } from "svelte";
  import { BLOCKS, type BlockId } from "../blocks";
  import {
    parseCanvas,
    addItem,
    updateItem,
    deleteItem,
    type ParsedCanvas,
  } from "../canvas-parser";
  import Block from "./Block.svelte";

  interface Props {
    app: App;
    file: TFile;
    fileVersion?: number;
  }

  let { app, file, fileVersion = 0 }: Props = $props();

  let parsed = $state.raw<ParsedCanvas>(parseCanvas(""));
  let loaded = $state(false);

  async function reload() {
    const content = await app.vault.cachedRead(file);
    parsed = parseCanvas(content);
    loaded = true;
  }

  onMount(reload);

  // Re-parse when the file changes on disk (vault modify → fileVersion bump).
  // queueMicrotask keeps `fileVersion` as the effect's only dependency.
  $effect(() => {
    if (fileVersion > 0) {
      queueMicrotask(reload);
    }
  });

  /** Apply a pure edit to the file's content atomically, then reload. */
  async function edit(fn: (content: string) => string) {
    await app.vault.process(file, fn);
    await reload();
  }

  function handleAdd(blockId: BlockId, text: string) {
    edit((c) => addItem(c, blockId, text));
  }

  function handleUpdate(blockId: BlockId, index: number, text: string) {
    edit((c) => updateItem(c, blockId, index, text));
  }

  function handleDelete(blockId: BlockId, index: number) {
    edit((c) => deleteItem(c, blockId, index));
  }
</script>

<div class="bmc-root">
  {#if loaded}
    <div class="bmc-grid">
      {#each BLOCKS as def (def.id)}
        <Block
          {app}
          sourcePath={file.path}
          area={def.area}
          title={def.title}
          block={parsed[def.id]}
          onadd={(text) => handleAdd(def.id, text)}
          onupdate={(index, text) => handleUpdate(def.id, index, text)}
          ondelete={(index) => handleDelete(def.id, index)}
        />
      {/each}
    </div>
  {/if}
</div>
