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

## Outbound Lead Discovery — 10 Steps

| # | Step ID | Name | Wave |
|---|---------|------|------|
| 1 | `parse-icp` | Parse and Validate ICP Definition | 0 |
| 2 | `generate-search-queries` | Generate Targeted Search Queries | 1 |
| 3 | `discover-companies` | Discover Candidate Companies | 2 |
| 4 | `deduplicate-companies` | Deduplicate and Filter Companies | 3 |
| 5 | `enrich-companies` | Enrich Companies with Firmographic Data | 4 |
| 6 | `identify-decision-makers` | Identify Decision-Maker Contacts | 5 |
| 7 | `enrich-contacts` | Enrich Contacts with Professional Details | 6 |
| 8 | `crm-suppression` | Suppress Existing CRM Records | 7 |
| 9 | `score-and-rank` | Score and Rank Leads | 8 |
| 10 | `persist-output` | Format and Persist Prospect List | 9 |

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

## Definition format

Every agent definition is a YAML (or JSON) document with four top-level sections:

```yaml
apiVersion: "agent.definition/v1"
kind: AgentDefinition

metadata:
  name: my-agent
  version: "1.0.0"

spec:
  objective: { ... }
  orar: { ... }          # Objective, Resources, Actions, Results
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
3. Edit `spec.objective`, `spec.orar`, `spec.options`, `spec.policies`,
   `spec.tools`, and `spec.steps`.
4. Validate:
   ```bash
   npm run validate definitions/my-new-agent.v1.0.0.yaml
   ```

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
