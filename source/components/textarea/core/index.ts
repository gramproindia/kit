// Framework-free: character counting and the auto-resize math.
export { countCharacters } from "./count";
export { fitHeight, heightForRows } from "./size";
export { defaultTextareaText } from "./locale";
export type * from "./types";
// The agent contract: what a model may ask this field to do.
export { textareaContract, type TextareaAgentProps } from "./agent";
