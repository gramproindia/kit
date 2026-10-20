export { cx } from "./core/cx";
export { countCharacters } from "./core/text";
export { describeField, type DescribedByParts } from "./core/field";
export { useControllableState } from "./react/useControllableState";
export { AnchoredPopover, type AnchoredPopoverProps } from "./react/Popover";
export { placePopover, type Align, type Placement, type Side } from "./core/position";
export * as icons from "./react/icons";
export { version as sharedVersion } from "./version";

// Agent runtime: the component-agnostic operation/validation/history layer.
export * from "./core/agent";
export {
  GramproAIProvider,
  useAgentAdapter,
  type GramproAIProviderProps,
} from "./react/GramproAIProvider";
export { useAskAgent, type AskableAgent, type AskExecution, type UseAskAgent } from "./react/useAskAgent";
export { useFieldAgent, type UseFieldAgentOptions } from "./react/useFieldAgent";
export { AgentSurface, useAgentSurface, type AgentSurfaceProps } from "./react/AgentSurface";
export {
  useInAgentSurface,
  type SurfaceFieldSource,
  type SurfaceGridAgent,
} from "./react/agentSurfaceContext";
