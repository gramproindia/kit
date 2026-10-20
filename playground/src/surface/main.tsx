import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SurfaceFixture } from "./SurfaceFixture";
import "../index.css";
import "@/components/data-grid/styles.css";

/*
 * A stand-in for the browser's WebMCP, installed before anything renders, so
 * the e2e test can call the tool the page registers exactly as an agent would.
 * Like the real one it throws on a duplicate name, which is what makes
 * StrictMode's double effects a real test here rather than a formality.
 */
type Tool = { name: string; execute(input: unknown): Promise<unknown> };
const tools: Record<string, Tool> = {};
(window as unknown as { __tools: typeof tools }).__tools = tools;
Object.defineProperty(document, "modelContext", {
  configurable: true,
  value: {
    registerTool(tool: Tool) {
      if (tools[tool.name]) throw new Error(`Duplicate tool name: ${tool.name}`);
      tools[tool.name] = tool;
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SurfaceFixture />
  </StrictMode>,
);
