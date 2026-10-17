export { formatNumber, numberFormat } from "./format";
export { localeParts, parseNumber, toEditText, type NumberLocaleParts } from "./parse";
export { clamp, decimalsOf, round, snapToStep, stepBy } from "./step";
export type * from "./types";
// The agent contract: what a model may ask this field to do.
export { numberInputContract, type NumberInputAgentProps } from "./agent";
