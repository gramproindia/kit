// Framework-free: character counting and the OTP rules the components use.
export { countCharacters } from "./count";
export {
  activeCell,
  cellAt,
  otpInputMode,
  otpPattern,
  sanitizeOtp,
  separatorsAfter,
} from "./otp";
export type * from "./types";
// The agent contract: what a model may ask this field to do.
export { inputContract, type InputAgentProps } from "./agent";
