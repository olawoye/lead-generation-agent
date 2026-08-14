# Lead Generation Agent — Agent Definition

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A **platform-agnostic, versioned declarative definition** of an outbound
lead-discovery AI agent. The definition describes *what* the agent does using
JSON/YAML and JSON Schema — completely independent of any AI provider
(Claude, Codex, etc.), runtime framework, or communication protocol (MCP,
REST, gRPC).

---

## Contents

```
.
├── definitions/
│   └── outbound-lead-discovery.v1.0.0.yaml   ← the 10-step agent definition
├── schemas/
│   └── v1/
│       └── agent-definition.schema.json       ← JSON Schema (draft-07)
├── src/
│   ├── types.ts        ← TypeScript types (convenience; schema is authoritative)
│   ├── loader.ts       ← YAML/JSON loader + AJV schema validator
│   ├── resolver.ts     ← topological sort + tool reference validator
│   ├── index.ts        ← public API
│   └── validate.ts     ← CLI validation script
├── examples/
│   └── typescript-runtime-stub.ts   ← example of how a TS runtime consumes the definition
├── __tests__/
│   └── agent-definition.test.ts     ← Jest tests
└── docs/
    ├── schema-reference.md          ← field-by-field schema reference
    └── runtime-contract.md          ← runtime implementation contract
```

---

## Outbound Lead Discovery — 10 Declarative Steps

| # | Phase | Step ID | Name |
|---|---|---------|------|
| 1 | Discover | `search_engine_prospecting` | Search Engine Prospecting |
| 2 | Discover | `directory_mining` | Business & Professional Directory Mining |
| 3 | Discover | `public_data_prospecting` | Public Data & Open Registers |
| 4 | Discover | `marketplace_prospecting` | Marketplace & Platform Prospecting |
| 5 | Discover | `website_technology_discovery` | Website & Technology Discovery |
| 6 | Discover | `geographic_territory_prospecting` | Geographic & Territory Prospecting |
| 7 | Identify Buying Signals | `competitive_intelligence_prospecting` | Competitive Intelligence Prospecting |
| 8 | Identify Buying Signals | `event_community_prospecting` | Event & Community Prospecting |
| 9 | Identify Buying Signals | `intent_trigger_based_prospecting` | Intent & Trigger-Based Prospecting |
| 10 | Enrich & Qualify | `lead_enrichment_qualification` | Lead Enrichment & Qualification |

---

## Quick start

### Install dependencies

```bash
npm install
```

### Validate the definition

```bash
npm run validate definitions/outbound-lead-discovery.v1.0.0.yaml
```

### Run tests

```bash
npm test
```

### Build TypeScript

```bash
npm run build
```

### Run the example TypeScript runtime stub

```bash
npx ts-node examples/typescript-runtime-stub.ts
```

---

## Sample SaaS manifest

The repository includes a sample runtime manifest at [definitions/outbound-lead-discovery.manifest.json](definitions/outbound-lead-discovery.manifest.json). This is not the workflow definition itself; it is a deployment-time wiring file for a host SaaS app.

Use it as a template for the app layer to map the declarative workflow to actual MCP servers and runtime endpoints.

### How the SaaS app should use it

1. Load the workflow YAML definition from [definitions/outbound-lead-discovery.v1.0.0.yaml](definitions/outbound-lead-discovery.v1.0.0.yaml).
2. Resolve tool names from the canonical registry in [../mcp-toolkit/registry/tools.json](../mcp-toolkit/registry/tools.json).
3. Replace the example endpoints and commands with the app's real environment values.
4. Register the manifest with the host runtime so that the execution engine can resolve tool calls to the correct servers.
5. Keep persistence, job state, retries, cancellation, and auditing in the SaaS app layer rather than in this repo.

### Example flow

```json
{
  "servers": [
    {
      "name": "web-search",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@mcp-toolkit/server-web-search"]
    },
    {
      "name": "enrichment",
      "transport": "http",
      "url": "https://svc.example.com/mcp/enrichment"
    }
  ]
}
```

This manifest is the app-side contract that tells the runtime which capability servers exist, how to reach them, and which tools they provide.

---

## Definition format

Every agent definition is a YAML (or JSON) document with the core top-level sections below:

```yaml
apiVersion: "agent.definition/v1"
kind: AgentDefinition

metadata:
  name: my-agent
  version: "1.0.0"

spec:
  objective: { ... }
  orar: { ... }          # Objective, Resources, Actions, Results
  state: { ... }         # normalized shared lead state contract
  options: { ... }       # configurable parameters
  policies: { ... }      # runtime enforcement rules
  tools: [ ... ]         # logical tool requirements
  steps: [ ... ]         # declarative 10-step pipeline
```

See [`docs/schema-reference.md`](docs/schema-reference.md) for the full
field reference and [`docs/runtime-contract.md`](docs/runtime-contract.md)
for the expectations placed on runtimes.

---

## Adding a new agent definition

1. Copy `definitions/outbound-lead-discovery.v1.0.0.yaml`.
2. Update `metadata.name` and `metadata.version`.
3. Edit `spec.objective`, `spec.orar`, `spec.state`, `spec.options`,
   `spec.policies`, `spec.tools`, and `spec.steps`.
4. Validate:
   ```bash
   npm run validate definitions/my-new-agent.v1.0.0.yaml
   ```

---

## Architectural guardrails and TODOs

This repository is intentionally a declarative workflow source of truth. It should not become a live runtime state store.

### Guardrails

- Keep all workflow definitions versioned and stateless.
- Do not persist execution checkpoints, tenant job history, retries, or billing data here.
- Keep tool IDs abstract and capability-based.
- Keep runtime orchestration outside this repo.
- Keep the schema authoritative; generated TypeScript types are helper-only.

### TODOs

- [ ] Define a formal runtime handoff contract for resume/checkpoint payloads.
- [ ] Document the exact host-side persistence responsibilities for the SaaS layer.
- [ ] Add examples of versioning and migration between workflow definitions.
- [ ] Add clearer examples of runtime-generated status events and app-owned persistence.
- [ ] Keep business logic declarative and provider-neutral.

---

## Versioning

Definitions are versioned independently of this repository.  
The schema itself is versioned via `apiVersion` (`agent.definition/v1`).

| Change type | Version bump |
|-------------|--------------|
| New optional field added to schema | minor |
| Required field added or field removed | major |
| Bugfix to schema constraints | patch |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT
