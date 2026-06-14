import { Component, MarkdownRenderer, type App } from "obsidian";

export interface RenderMarkdownParams {
  app: App;
  markdown: string;
  sourcePath: string;
}

function renderInto(
  node: HTMLElement,
  params: RenderMarkdownParams,
): Component {
  const component = new Component();
  component.load();
  MarkdownRenderer.render(
    params.app,
    params.markdown,
    node,
    params.sourcePath,
    component,
  );
  return component;
}

export function renderMarkdown(
  node: HTMLElement,
  params: RenderMarkdownParams,
) {
  let component = renderInto(node, params);

  return {
    update(newParams: RenderMarkdownParams) {
      component.unload();
      node.empty();
      component = renderInto(node, newParams);
    },
    destroy() {
      component.unload();
      node.empty();
    },
  };
}
