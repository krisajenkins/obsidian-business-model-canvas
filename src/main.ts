import { Plugin, TFolder, type TFile } from "obsidian";
import { CanvasView, VIEW_TYPE_BMC } from "./canvas-view.svelte";
import { emptyCanvasMarkdown } from "./canvas-parser";

export default class BusinessModelCanvasPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_BMC, (leaf) => new CanvasView(leaf));

    this.addCommand({
      id: "open-as-canvas",
      name: "Open current file as Business Model Canvas",
      checkCallback: (checking: boolean) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (checking) return true;
        this.openCanvasView(file);
      },
    });

    this.addCommand({
      id: "create-canvas",
      name: "Create new Business Model Canvas",
      callback: () => this.createCanvas(),
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof Object) || !("extension" in file)) return;
        if ((file as TFile).extension !== "md") return;
        menu.addItem((item) => {
          item
            .setTitle("Open as Business Model Canvas")
            .setIcon("layout-dashboard")
            .onClick(() => this.openCanvasView(file as TFile));
        });
      }),
    );
  }

  async onunload(): Promise<void> {
    // Intentionally not detaching leaves — lets hot-reload preserve open
    // canvas panes across plugin reloads.
  }

  private async openCanvasView(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getLeaf("split");
    await leaf.setViewState({
      type: VIEW_TYPE_BMC,
      state: { filePath: file.path },
    });
    this.app.workspace.revealLeaf(leaf);
  }

  private async createCanvas(): Promise<void> {
    const active = this.app.workspace.getActiveFile();
    const parent = active?.parent instanceof TFolder ? active.parent.path : "";
    const path = await this.uniquePath(parent, "Business Model Canvas");
    const file = await this.app.vault.create(path, emptyCanvasMarkdown());
    await this.openCanvasView(file);
  }

  /** Find an unused "<base>.md" / "<base> N.md" path in a folder. */
  private async uniquePath(folder: string, base: string): Promise<string> {
    const prefix = folder ? `${folder}/` : "";
    for (let n = 0; ; n++) {
      const name = n === 0 ? base : `${base} ${n}`;
      const path = `${prefix}${name}.md`;
      if (!(await this.app.vault.adapter.exists(path))) return path;
    }
  }
}
