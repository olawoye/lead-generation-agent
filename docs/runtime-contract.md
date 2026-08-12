# Runtime Contract

This document defines the expectations placed on any runtime that executes
an `agent.definition/v1` AgentDefinition.

---

## Overview

The Agent Definition package is **purely declarative**. It describes *what*
the agent does, not *how* to do it. The runtime is responsible for:

- Loading and validating the definition.
- Resolving tools to concrete implementations.
- Executing steps in dependency order.
- Enforcing policies.
- Wiring step inputs/outputs.
- Keeping a shared normalized lead state across the workflow without hard-coding the business logic.

The runtime must treat each step as a declarative step definition with fields like `enabled`, `objective`, `inputs`, `tools`, `configuration`, `outputs`, `next_steps`, `quality_rules`, and `retry_policy`.

---

## Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│  1. Load          Parse YAML/JSON definition file.       │
│  2. Validate      Run JSON Schema validation.            │
│  3. Resolve       Map logical tool IDs to implementations│
│  4. Plan          Topological sort of steps (waves).     │
│  5. Configure     Apply agent options, validate against  │
│                   spec.options schema.                   │
│  6. Execute       Run waves. For each step:              │
│     a. Resolve inputs (source references + options).     │
│     b. Invoke the step (call AI/tools as needed).        │
│     c. Validate outputs.                                 │
│     d. Apply step policy (retry, timeout, cache).        │
│  7. Finalise      Emit run summary.                      │
└─────────────────────────────────────────────────────────┘
```

---

## Tool resolution

`spec.tools` declares logical tools by ID and capability tags.
The runtime maintains a **tool registry** that maps capability tags to
concrete implementations. At startup the runtime:

1. Iterates `spec.tools`.
2. For each tool, looks up a registered implementation matching one or more
   of its `capabilities`.
3. Raises an error for any non-optional tool whose capabilities cannot be
   satisfied, and warns for optional ones.

The runtime **must not** hard-code tool implementations inside the definition.

---

## Input/output wiring

Each step may declare either a list of input names or an object map of named
values. The runtime must resolve the step’s declared inputs from:

- the shared normalized state
- prior step outputs
- agent `options`

For object-based inputs, a runtime may still use `source` references in the
`"stepId.outputName"` or `"options.fieldName"` notation. The runtime:

- Before executing a step, resolves all required input values from the shared state or upstream outputs.
- Validates resolved values against the expected data contract.
- Keeps `confidence`, `provenance`, `buying_signals`, and `qualification_score` attached to the evolving lead state instead of discarding them.

---

## Policy enforcement

| Policy | Scope | Enforcement |
|--------|-------|-------------|
| `maxRetries` | global / per-step | Retry a failed step up to this many times with exponential back-off before propagating the error. |
| `timeoutSeconds` | global | Cancel the entire run if wall-clock time exceeds this value. |
| `rateLimiting.requestsPerMinute` | global | Throttle outbound tool calls. |
| `rateLimiting.concurrentSteps` | global | Limit simultaneous step executions within a wave. |
| `privacy.maskPII` | global | Redact PII patterns from logs and persisted intermediate data. |
| `privacy.retentionDays` | global | Purge intermediate data after this many days. |
| `errorHandling` | global | `fail-fast`: stop on first error. `continue-on-error`: mark step as failed and continue. `rollback`: revert any side-effects and stop. |
| `step.policy.cacheResults` | per-step | The runtime may store and reuse the step's outputs across identical inputs. |

---

## Shared state contract

The definition declares a `spec.state` block used to maintain a single normalized,
deduplicated lead state through the workflow. The runtime must treat this as the
execution state and progressively enrich it as each step produces new evidence.

Required semantics:

- `state.dedupeKeys` defines the identity keys used to merge records.
- `state.leadRecord.properties.company` carries the canonical company data.
- `state.leadRecord.properties.person` carries person/contact data when available.
- `state.leadRecord.properties.buying_signals` collects buying-intent evidence.
- `state.leadRecord.properties.confidence` tracks confidence from 0 to 1.
- `state.leadRecord.properties.provenance` stores source URLs, timestamps, and evidence.
- `state.leadRecord.properties.qualification_score` reflects the final prioritized score from 0 to 100.

The runtime must not create disconnected result lists when a record is already
part of the shared state; it must merge and enrich the canonical record instead.

## What the runtime must NOT do

- Reference any specific AI provider in the step execution logic derived
  solely from the definition.
- Alter `metadata.version` of the definition at runtime.
- Skip policy enforcement.
- Execute steps in a different order than the topological sort requires.
- Replace the normalized shared state with ad-hoc per-step output lists.

---

## Adding a new runtime

1. Implement the **Load → Validate → Resolve → Plan → Execute** lifecycle.
2. Implement a tool registry that maps `capabilities` to your runtime's
   concrete tools.
3. Run the provided test suite against the reference definition:
   ```
   npm test
   ```
4. Validate your runtime against at least the `outbound-lead-discovery`
   reference definition.
