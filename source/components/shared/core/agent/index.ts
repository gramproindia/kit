/*
 * The component-agnostic half of the agent runtime. Nothing here knows about
 * a grid, a date picker, or React.
 */

export type {
  ConfirmRequest,
  ExecutionContext,
  ExecutorRegistry,
  JsonSchema,
  JsonSchemaType,
  OperationDefinition,
  OperationExecutor,
  RegisteredExecutor,
  ValidationIssue,
  ValidationLayer,
  ValidationResult,
} from "./types";
export { fail, ok } from "./types";
export { checkSchema, type SchemaIssue } from "./schema";
export {
  createSnapshotHistory,
  type SnapshotEntry,
  type SnapshotHistory,
  type SnapshotHistoryOptions,
} from "./history";
export { parseQuantity, type ParseQuantityOptions, type Quantity } from "./numbers";
export {
  buildToolInputSchema,
  registerAgentTool,
  runProjected,
  toToolResult,
  webmcpAvailable,
  type ModelContext,
  type ProjectableAgent,
  type ProjectedCommand,
  type ProjectedOutcome,
  type RegisterAgentToolOptions,
  type RegistrationResult,
  type ToolCallLog,
  type ToolResultPayload,
} from "./webmcp";
export type {
  AgentAdapter,
  AgentProposalRequest,
  AskOutcome,
  AskPhase,
} from "./adapter";

/*
 * The field runtime. A grid's operations are a language; a field has one verb,
 * so the verb lives here once rather than eight times.
 */
export {
  fieldOperations,
  setValueSchema,
  validateFieldIntent,
  type FieldCommand,
  type FieldContract,
  type FieldIntent,
  type FieldKind,
  type FieldOperationName,
  type FieldOption,
} from "./field";
export {
  autoFieldExecutors,
  domFieldExecutors,
  handleFieldExecutors,
  type FieldExecutionContext,
  type FieldHandleTarget,
} from "./field-executors";
export {
  createFieldAgent,
  type FieldAgent,
  type FieldAgentOptions,
  type FieldExecution,
} from "./field-agent";
/*
 * A page that describes itself to an agent: every operable component, what it
 * holds and accepts, one tool to operate them through their own validators.
 */
export {
  createAgentSurface,
  describeFieldContract,
  projectFieldAgent,
  registerSurfaceTool,
  SURFACE_TOOL_NAME,
  SURFACE_TOOL_SCHEMA,
  SURFACE_VERSION,
  type AgentSurfaceHandle,
  type RegisterSurfaceToolOptions,
  type SurfaceEntry,
  type SurfaceManifest,
  type SurfaceMember,
} from "./surface";
/* Browser-only: everything above this line runs on a server too. */
export { writable, writeChecked, writeValue } from "./write";
