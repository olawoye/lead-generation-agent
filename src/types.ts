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
  dependsOn?: string[];
  tools?: string[];
  inputs: Record<string, IOProperty>;
  outputs: Record<string, IOProperty>;
  policy?: StepPolicy;
  tags?: string[];
}

export interface IOProperty {
  type: string;
  description: string;
  required?: boolean;
  /** For inputs: "stepId.outputName" reference to a prior step output or "options.fieldName". */
  source?: string;
  [key: string]: unknown;
}

export interface StepPolicy {
  maxRetries?: number;
  timeoutSeconds?: number;
  cacheResults?: boolean;
}
