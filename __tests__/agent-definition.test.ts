import * as path from "path";
import * as fs from "fs";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import * as yaml from "js-yaml";
import { loadDefinition } from "../src/loader";
import { resolveExecutionOrder, validateToolReferences } from "../src/resolver";
import type { AgentDefinition } from "../src/types";

const SCHEMA_PATH = path.resolve(
  __dirname,
  "../schemas/v1/agent-definition.schema.json"
);
const DEFINITION_PATH = path.resolve(
  __dirname,
  "../definitions/outbound-lead-discovery.v1.0.0.yaml"
);

// ── Schema existence ────────────────────────────────────────────────────────

describe("Schema", () => {
  it("should exist on disk", () => {
    expect(fs.existsSync(SCHEMA_PATH)).toBe(true);
  });

  it("should be valid JSON", () => {
    const raw = fs.readFileSync(SCHEMA_PATH, "utf8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("should compile with AJV without errors", () => {
    const ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(ajv);
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
    expect(() => ajv.compile(schema)).not.toThrow();
  });
});

// ── Definition file ─────────────────────────────────────────────────────────

describe("outbound-lead-discovery definition file", () => {
  it("should exist on disk", () => {
    expect(fs.existsSync(DEFINITION_PATH)).toBe(true);
  });

  it("should parse as valid YAML without errors", () => {
    const raw = fs.readFileSync(DEFINITION_PATH, "utf8");
    expect(() => yaml.load(raw)).not.toThrow();
  });
});

// ── Loader ──────────────────────────────────────────────────────────────────

describe("loadDefinition()", () => {
  let result: ReturnType<typeof loadDefinition>;

  beforeAll(() => {
    result = loadDefinition(DEFINITION_PATH);
  });

  it("should return valid = true", () => {
    if (!result.valid) {
      console.error("Validation errors:", result.errors);
    }
    expect(result.valid).toBe(true);
  });

  it("should produce no schema errors", () => {
    expect(result.errors).toHaveLength(0);
  });

  it("should have the correct apiVersion and kind", () => {
    expect(result.definition.apiVersion).toBe("agent.definition/v1");
    expect(result.definition.kind).toBe("AgentDefinition");
  });

  it("should have correct metadata", () => {
    expect(result.definition.metadata.name).toBe("outbound-lead-discovery");
    expect(result.definition.metadata.version).toBe("1.0.0");
  });

  it("should have exactly 10 steps", () => {
    expect(result.definition.spec.steps).toHaveLength(10);
  });

  it("should have ORAR with all four fields", () => {
    const { orar } = result.definition.spec;
    expect(typeof orar.objective).toBe("string");
    expect(Array.isArray(orar.resources)).toBe(true);
    expect(Array.isArray(orar.actions)).toBe(true);
    expect(Array.isArray(orar.results)).toBe(true);
  });

  it("should have at least one success criterion", () => {
    expect(result.definition.spec.objective.successCriteria.length).toBeGreaterThan(0);
  });

  it("should have declared tools", () => {
    expect((result.definition.spec.tools ?? []).length).toBeGreaterThan(0);
  });

  it("should define a normalized shared state with dedupe, provenance, and confidence metadata", () => {
    const { state } = result.definition.spec;
    expect(state).toBeDefined();
    expect(state?.dedupeKeys).toEqual(expect.arrayContaining(["domain", "email", "company_name"]));
    expect(state?.leadRecord?.properties).toHaveProperty("company");
    expect(state?.leadRecord?.properties?.confidence).toBeDefined();
    expect(state?.leadRecord?.properties?.provenance).toBeDefined();
  });
});

// ── Resolver ─────────────────────────────────────────────────────────────────

describe("resolveExecutionOrder()", () => {
  let definition: AgentDefinition;

  beforeAll(() => {
    definition = loadDefinition(DEFINITION_PATH).definition;
  });

  it("should return 10 resolved steps", () => {
    const order = resolveExecutionOrder(definition);
    expect(order).toHaveLength(10);
  });

  it("should assign wave 0 to the first discovery step (search_engine_prospecting)", () => {
    const order = resolveExecutionOrder(definition);
    const first = order.find((r) => r.step.id === "search_engine_prospecting");
    expect(first?.wave).toBe(0);
  });

  it("should assign wave 1 to directory_mining", () => {
    const order = resolveExecutionOrder(definition);
    const step = order.find((r) => r.step.id === "directory_mining");
    expect(step?.wave).toBe(1);
  });

  it("should place lead_enrichment_qualification last (highest wave)", () => {
    const order = resolveExecutionOrder(definition);
    const maxWave = Math.max(...order.map((r) => r.wave));
    const last = order.find((r) => r.step.id === "lead_enrichment_qualification");
    expect(last?.wave).toBe(maxWave);
  });

  it("should throw on a circular dependency", () => {
    const circular: AgentDefinition = {
      ...definition,
      spec: {
        ...definition.spec,
        steps: [
          {
            id: "a",
            name: "A",
            description: "step a",
            dependsOn: ["b"],
            inputs: {},
            outputs: {},
          },
          {
            id: "b",
            name: "B",
            description: "step b",
            dependsOn: ["a"],
            inputs: {},
            outputs: {},
          },
        ],
      },
    };
    expect(() => resolveExecutionOrder(circular)).toThrow(/[Cc]ircular/);
  });

  it("should throw on an unknown dependency", () => {
    const bad: AgentDefinition = {
      ...definition,
      spec: {
        ...definition.spec,
        steps: [
          {
            id: "a",
            name: "A",
            description: "step a",
            dependsOn: ["nonexistent"],
            inputs: {},
            outputs: {},
          },
        ],
      },
    };
    expect(() => resolveExecutionOrder(bad)).toThrow(/unknown dependency/);
  });
});

// ── Tool reference validation ──────────────────────────────────────────────

describe("validateToolReferences()", () => {
  it("should return no errors for the valid definition", () => {
    const definition = loadDefinition(DEFINITION_PATH).definition;
    const errors = validateToolReferences(definition);
    expect(errors).toHaveLength(0);
  });

  it("should report an error for an undeclared tool reference in a step", () => {
    const definition = loadDefinition(DEFINITION_PATH).definition;
    const tampered: AgentDefinition = {
      ...definition,
      spec: {
        ...definition.spec,
        steps: [
          {
            ...definition.spec.steps[0],
            tools: ["ghost-tool"],
          },
          ...definition.spec.steps.slice(1),
        ],
      },
    };
    const errors = validateToolReferences(tampered);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/ghost-tool/);
  });
});
