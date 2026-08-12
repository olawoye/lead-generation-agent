# Agent Definition — Schema Reference (v1)

This document describes every field in the `agent.definition/v1` format.
The authoritative contract is the JSON Schema at
`schemas/v1/agent-definition.schema.json`.

---

## Top-level document

| Field | Required | Description |
|-------|----------|-------------|
| `apiVersion` | ✅ | Must be `"agent.definition/v1"`. |
| `kind` | ✅ | Must be `"AgentDefinition"`. |
| `metadata` | ✅ | Identity and version information. |
| `spec` | ✅ | The agent specification. |

---

## `metadata`

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Unique machine-readable name (lowercase, alphanumeric, hyphens). |
| `version` | ✅ | SemVer string, e.g. `"1.0.0"`. |
| `displayName` | ❌ | Human-readable name. |
| `description` | ❌ | Free text description. |
| `tags` | ❌ | Array of string tags. |
| `author` | ❌ | Author name. |
| `license` | ❌ | SPDX license identifier. |

---

## `spec.objective`

Describes what the agent is meant to achieve.

| Field | Required | Description |
|-------|----------|-------------|
| `summary` | ✅ | One-sentence summary. |
| `successCriteria` | ✅ | Array of measurable success conditions. |
| `context` | ❌ | Background context. |

---

## `spec.orar`

ORAR (Objective, Resources, Actions, Results) is a structured decomposition
of the agent's purpose.

| Field | Required | Description |
|-------|----------|-------------|
| `objective` | ✅ | What the agent is trying to achieve (ORAR framing). |
| `resources` | ✅ | Data sources and inputs required. |
| `actions` | ✅ | High-level actions the agent performs. |
| `results` | ✅ | Expected outputs and outcomes. |

---

## `spec.state`

Defines the normalized execution state shared across the workflow. This allows
steps to progressively enrich the same lead/company record rather than producing
unrelated lists.

| Field | Required | Description |
|-------|----------|-------------|
| `dedupeKeys` | ✅ | Keys used to deduplicate records across all steps (e.g. `domain`, `email`, `company_name`). |
| `leadRecord` | ✅ | Canonical record shape for the merged lead state. |

`leadRecord.properties` includes fields such as `company`, `person`,
`buying_signals`, `confidence`, `provenance`, and `qualification_score`.

---

## `spec.options`

Defines the configurable parameters that can be passed to the agent at
runtime. This is a JSON Schema `properties` fragment.

| Field | Required | Description |
|-------|----------|-------------|
| `properties` | ✅ | Map of option names to `OptionProperty` objects. |
| `required` | ❌ | Array of required option names. |

Each `OptionProperty` must have `type` and `description`. Additional JSON
Schema fields (`default`, `enum`, `minimum`, `maximum`, `items`) are allowed.

---

## `spec.policies`

Declarative policies that runtimes **must** enforce.

| Field | Description |
|-------|-------------|
| `maxRetries` | Max retries per step on transient failure. |
| `timeoutSeconds` | Max wall-clock seconds for the entire run. |
| `rateLimiting.requestsPerMinute` | Max requests to external tools per minute. |
| `rateLimiting.concurrentSteps` | Max number of steps executing simultaneously. |
| `privacy.maskPII` | Whether PII must be masked in logs. |
| `privacy.retentionDays` | Days intermediate results may be retained. |
| `errorHandling` | `fail-fast` \| `continue-on-error` \| `rollback`. |

---

## `spec.tools`

An array of `ToolRequirement` objects. Each declares a logical tool the
agent needs; runtimes map these to concrete implementations.

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✅ | Unique identifier, referenced from steps. |
| `description` | ✅ | Human-readable description. |
| `capabilities` | ✅ | Abstract capability tags (e.g. `web-search`, `file-write`). |
| `optional` | ❌ | If `true`, the agent can run in degraded mode without it. |

---

## `spec.steps`

An ordered array of `Step` objects describing the agent's work declaratively.
Runtimes use `dependsOn` to determine execution order (topological sort).

| Field | Required | Description |
|-------|----------|-------------|
| `id` | ✅ | Unique step ID (lowercase, alphanumeric, hyphens, underscores). |
| `name` | ✅ | Human-readable step name. |
| `description` | ✅ | What this step does. Runtimes use this as the instruction seed. |
| `enabled` | ❌ | Whether this step is active. Defaults to `true`. |
| `objective` | ❌ | Declarative step objective as string or object. |
| `dependsOn` | ❌ | IDs of steps that must complete first. Defaults to `[]`. |
| `tools` | ❌ | Tool IDs (from `spec.tools`) used by this step. |
| `inputs` | ✅ | Declarative inputs: either string array or object map. |
| `outputs` | ✅ | Declarative outputs: either string array or object map. |
| `configuration` | ❌ | Step-specific runtime configuration payload. |
| `next_steps` | ❌ | Downstream steps the runtime may route to after success. |
| `quality_rules` | ❌ | Validation rules for step outputs. |
| `retry_policy` | ❌ | Retry configuration and backoff policy. |
| `policy` | ❌ | Per-step overrides for `maxRetries`, `timeoutSeconds`, `cacheResults`. |
| `tags` | ❌ | Arbitrary string tags. |

### `IOProperty`

| Field | Required | Description |
|-------|----------|-------------|
| `type` | ✅ | JSON Schema primitive type string. |
| `description` | ✅ | Human-readable description. |
| `required` | ❌ | Whether the input/output is required. Defaults to `true`. |
| `source` | ❌ | For inputs: `"stepId.outputName"` or `"options.fieldName"` reference. |

---

## Runtime contract

A conformant runtime **must**:

1. Load the definition file and validate it against `schemas/v1/agent-definition.schema.json`.
2. Validate that all tool IDs referenced in steps are declared in `spec.tools`.
3. Topologically sort steps using `dependsOn` to determine execution waves.
4. For each step, provide the declared inputs (resolving `source` references from prior step outputs or agent options).
5. Enforce `spec.policies` across the entire run.
6. Apply `step.policy` overrides for individual steps.
7. Produce outputs that match the declared `outputs` schema for each step.

A conformant runtime **must not**:

- Depend on any specific AI provider (Claude, Codex, etc.).
- Hard-code MCP or any other communication protocol.
- Require TypeScript as the implementation language.
