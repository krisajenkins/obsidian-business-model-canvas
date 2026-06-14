import { ItemView, type TFile, type WorkspaceLeaf } from "obsidian";
import { createClassComponent } from "svelte/legacy";
import CanvasApp from "./components/CanvasApp.svelte";

export const VIEW_TYPE_BMC = "business-model-canvas-view";

type CanvasAppInstance = {
  $set(props: Record<string, any>): void;
  $destroy(): void;
};

export class CanvasView extends ItemView {
  private svelteApp: CanvasAppInstance | null = null;
  private file: TFile | null = null;
  private fileVersion = 0;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_BMC;
  }

  getDisplayText(): string {
    return this.file
      ? `Canvas: ${this.file.basename}`
      : "Business Model Canvas";
  }

  getIcon(): string {
    return "layout-dashboard";
  }

  async setState(
    state: { filePath?: string },
    result: { history: boolean },
  ): Promise<void> {
    if (state.filePath) {
      const file = this.app.vault.getAbstractFileByPath(state.filePath);
      if (file && "basename" in file) {
        this.file = file as TFile;
      }
    }
    await super.setState(state, result);
    this.mountSvelte();
    this.registerFileWatcher();
  }

  getState(): { filePath?: string } {
    return { filePath: this.file?.path };
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass("bmc-container");
  }

  async onClose(): Promise<void> {
    this.destroySvelte();
  }

  private registerFileWatcher(): void {
    if (!this.file) return;
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (this.file && file.path === this.file.path) {
          this.fileVersion++;
          this.svelteApp?.$set({ fileVersion: this.fileVersion });
        }
      }),
    );
  }

  private mountSvelte(): void {
    this.destroySvelte();
    if (!this.file) return;

    this.contentEl.empty();
    this.fileVersion = 0;

    this.svelteApp = createClassComponent({
      component: CanvasApp,
      target: this.contentEl,
      props: { app: this.app, file: this.file, fileVersion: this.fileVersion },
    }) as unknown as CanvasAppInstance;
  }

  private destroySvelte(): void {
    if (this.svelteApp) {
      this.svelteApp.$destroy();
      this.svelteApp = null;
    }
  }
}
