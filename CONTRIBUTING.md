# Contributing

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9

## Setup

```bash
npm install
```

## Running tests

```bash
npm test
```

## Validating a definition file

```bash
npm run validate definitions/outbound-lead-discovery.v1.0.0.yaml
```

## Adding a new definition

1. Create a YAML file under `definitions/` following the naming convention
   `<agent-name>.v<semver>.yaml`.
2. Validate it with `npm run validate`.
3. Add or update tests in `__tests__/`.

## Schema changes

- Schema files live under `schemas/v1/`.
- Breaking changes require a new `apiVersion` (e.g. `agent.definition/v2`).
- Non-breaking changes (new optional fields) keep the same `apiVersion` and
   bump the `metadata.version` of affected definitions.

## Coding standards

- TypeScript strict mode is enabled.
- Keep `src/` free of any AI-provider-specific imports.
- All new TypeScript exports must be re-exported from `src/index.ts`.
