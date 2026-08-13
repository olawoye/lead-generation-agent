# AGENTS.md

## Repository purpose

This repository is the Agent Definition project for the outbound lead-discovery workflow.

It is the source of truth for the declarative business logic of the agent: what the system is trying to do, how the 10-step workflow is structured, what inputs/outputs each step consumes, what tools are required, what policies apply, and how results are validated.

This repo must remain independent of:
- the TypeScript runtime implementation
- any specific AI provider (Claude, Codex, OpenAI, etc.)
- MCP transport and protocol details
- the SaaS product layer

---

## Architecture boundary

This repo defines the "what" layer.

Related repositories:
- lead-generation-runtime-typescript: executes the definition and orchestrates runtime behavior
- mcp-toolkit: exposes reusable capability implementations and tool providers
- SaaS app: handles users, tenancy, jobs, UI, storage, and product orchestration

The agent definition is reusable across runtimes and applications. It should describe business intent and execution structure without embedding implementation logic.

---

## Core responsibilities

- versioned agent definitions and schema contracts
- declarative workflow steps
- ORAR, objective, strategy, configuration, and policies
- normalized lead/company data contract
- validation, documentation, and examples
- step dependency and execution semantics

---

## Rules for AI agents working here

- Keep the repository provider-neutral and runtime-neutral.
- Use abstract tool IDs and capability names rather than provider-specific APIs.
- Keep business workflow logic in YAML/JSON/schema, not in TypeScript runtime code.
- Each of the 10 steps must be a declarative Step Definition object with explicit inputs, outputs, tool references, configuration, quality rules, and retry behavior.
- Do not add hard-coded orchestration logic here.
- Keep the schema authoritative; TypeScript typings are convenience-only.
- Keep this repo stateless: no execution checkpoints, no run history, no tenant/job persistence, no runtime queue state, and no app-level billing or auditing data.
- Store all live operational state in the SaaS app / worker layer, not in the definition repository.

---

## Minimal architectural principle

This repo defines the declarative workflow contract only. It should stay a versioned specification package and not become a live operational database.

The app layer owns durable state for:
- run status
- retry and cancellation state
- checkpoints
- per-tenant job records
- audit and billing metadata

---

## TODOs

- [ ] Keep all workflow definitions versioned and declarative.
- [ ] Keep tool references abstract and capability-based.
- [ ] Document the runtime contract for checkpoint and resume semantics.
- [ ] Do not add persistence, queueing, or tenant state to this repo unless a concrete host-level requirement demands it.
- [ ] Keep the schema as the source of truth; generated types are convenience-only.

---

## Validation

Run:

```bash
npm install
npm test
npm run validate definitions/outbound-lead-discovery.v1.0.0.yaml
```

This repo is intended to be a reusable, versioned specification package that other runtimes can consume.
