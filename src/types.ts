/**
 * TypeScript types derived from the agent-definition.schema.json (v1).
 *
 * These types are provided as a convenience for TypeScript runtimes.
 * The schema — not these types — is the authoritative contract.
 * Non-TypeScript runtimes should validate against the JSON Schema directly.
 */

export type AgentDefinitionApiVersion = "agent.definition/v1";
export type AgentDefinitionKind = "AgentDefinition";

// ── Top-level document ─────────────────────────────────────────────────────

export interface AgentDefinition {
  apiVersion: AgentDefinitionApiVersion;
  kind: AgentDefinitionKind;
  metadata: Metadata;
  spec: AgentSpec;
}

// ── Metadata ───────────────────────────────────────────────────────────────

export interface Metadata {
  /** Unique machine-readable name, lowercase alphanumeric and hyphens only. */
  name: string;
  displayName?: string;
  /** Semantic version string, e.g. "1.0.0". */
  version: string;
  description?: string;
  tags?: string[];
  author?: string;
  license?: string;
}

// ── Spec ───────────────────────────────────────────────────────────────────

export interface AgentSpec {
  objective: Objective;
  orar: ORAR;
  state?: SharedStateSchema;
  options?: OptionsSchema;
  policies?: Policies;
  tools?: ToolRequirement[];
  steps: Step[];
}

// ── Objective ──────────────────────────────────────────────────────────────

export interface Objective {
  summary: string;
  successCriteria: string[];
  context?: string;
}

// ── ORAR ───────────────────────────────────────────────────────────────────

export interface ORAR {
  objective: string;
  resources: string[];
  actions: string[];
  results: string[];
}

// ── Options ────────────────────────────────────────────────────────────────

export interface OptionsSchema {
  required?: string[];
  properties: Record<string, OptionProperty>;
}

export interface OptionProperty {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  items?: object;
  [key: string]: unknown;
}

// ── Policies ───────────────────────────────────────────────────────────────

export interface Policies {
  maxRetries?: number;
  timeoutSeconds?: number;
  rateLimiting?: {
    requestsPerMinute?: number;
    concurrentSteps?: number;
  };
  privacy?: {
    maskPII?: boolean;
    retentionDays?: number;
  };
  errorHandling?: "fail-fast" | "continue-on-error" | "rollback";
}

export interface SharedStateSchema {
  dedupeKeys: string[];
  leadRecord: {
    type: string;
    properties: Record<string, SharedStateField>;
  };
}

export interface SharedStateField {
  type: string;
  description: string;
  required?: boolean;
  items?: Record<string, unknown>;
  [key: string]: unknown;
}

// ── Tool requirement ────────────────────────────────────────────────────────

export interface ToolRequirement {
  id: string;
  description: string;
  capabilities: string[];
  optional?: boolean;
}

// ── Step ───────────────────────────────────────────────────────────────────

export interface Step {
  id: string;
  name: string;
  description: string;
  enabled?: boolean;
  objective?: string | StepObjective;
  dependsOn?: string[];
  tools?: string[];
  inputs?: string[] | Record<string, IOProperty>;
  outputs?: string[] | Record<string, IOProperty>;
  configuration?: Record<string, unknown>;
  next_steps?: string[];
  quality_rules?: QualityRule[];
  retry_policy?: RetryPolicy;
  policy?: StepPolicy;
  tags?: string[];
}

export interface StepObjective {
  summary?: string;
  details?: string;
  measurable?: string;
  sources?: string[];
}

export interface IOProperty {
  type: string;
  description: string;
  required?: boolean;
  /** For inputs: "stepId.outputName" reference to a prior step output or "options.fieldName". */
  source?: string;
  [key: string]: unknown;
}

export interface QualityRule {
  id?: string;
  rule: string;
  severity?: "error" | "warning" | "info";
  message?: string;
  params?: Record<string, unknown>;
}

export interface RetryPolicy {
  max_attempts?: number;
  backoff_ms?: number;
  backoff_multiplier?: number;
  max_backoff_ms?: number;
  retry_on?: string[];
  do_not_retry_on?: string[];
}

export interface StepPolicy {
  maxRetries?: number;
  timeoutSeconds?: number;
  cacheResults?: boolean;
}
