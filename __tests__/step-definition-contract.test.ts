import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const SCHEMA_PATH = path.resolve(
  __dirname,
  "../schemas/v1/agent-definition.schema.json"
);

function validateStepAgainstSchema(step: unknown): { valid: boolean; errors: any[] } {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const validate = ajv.compile(schema);

  const agentDefinition = {
    apiVersion: "agent.definition/v1",
    kind: "AgentDefinition",
    metadata: {
      name: "step-contract-test",
      version: "1.0.0",
    },
    spec: {
      objective: {
        summary: "Test objective",
        successCriteria: ["passes"],
      },
      orar: {
        objective: "Test objective",
        resources: [],
        actions: [],
        results: [],
      },
      tools: [],
      steps: [step],
    },
  };

  const valid = validate(agentDefinition);

  return {
    valid,
    errors: validate.errors ?? [],
  };
}

describe("Declarative Step Definition contract", () => {
  it("accepts a modern step with enabled, objective, configuration, next_steps, quality_rules, and retry_policy", () => {
    const step = {
      id: "search_engine_prospecting",
      name: "Search Engine Prospecting",
      description: "Find businesses matching the ICP using web search and mapping tools.",
      enabled: true,
      objective: "Discover businesses matching the ICP and geographic constraints.",
      inputs: ["icp", "geography"],
      tools: ["google_search", "maps"],
      configuration: {
        queries: [],
        max_results: 500,
        countries: ["CA"],
        languages: ["en"],
      },
      outputs: ["prospect_records"],
      next_steps: ["directory_mining", "website_analysis"],
      quality_rules: [
        {
          id: "minimum_domain",
          rule: "company_domain_required",
          severity: "error",
          message: "Each prospect must include a normalized domain.",
        },
      ],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 1000,
        backoff_multiplier: 2,
        max_backoff_ms: 20000,
        retry_on: ["timeout", "rate_limit"],
      },
    };

    const result = validateStepAgainstSchema(step);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts disabling a step without removing it from the definition", () => {
    const step = {
      id: "directory_mining",
      name: "Directory Mining",
      description: "Mine professional directories for candidate records.",
      enabled: false,
      objective: "Discover businesses in structured directories.",
      inputs: ["icp"],
      tools: ["directory_search"],
      configuration: {
        providers: ["linkedin", "crunchbase"],
        max_results: 250,
      },
      outputs: ["directory_records"],
      next_steps: ["website_analysis"],
      quality_rules: [],
      retry_policy: {
        max_attempts: 2,
        backoff_ms: 500,
        backoff_multiplier: 2,
        max_backoff_ms: 5000,
        retry_on: ["timeout"],
      },
    };

    const result = validateStepAgainstSchema(step);
    expect(result.valid).toBe(true);
  });

  it("allows explicit step-level routing via next_steps", () => {
    const step = {
      id: "website_analysis",
      name: "Website Analysis",
      description: "Inspect websites and technology signals.",
      enabled: true,
      objective: "Assess company fit, technology stack, and service relevance.",
      inputs: ["prospect_records"],
      tools: ["website_research", "technology_detection"],
      configuration: {
        max_pages: 5,
        detect_ctas: true,
      },
      outputs: ["technology_signals"],
      next_steps: ["competitive_intelligence", "lead_enrichment_qualification"],
      quality_rules: [
        {
          id: "tech_signal_present",
          rule: "technology_signal_or_service_match",
          severity: "warning",
          message: "Step can continue without direct technology evidence, but confidence is reduced.",
        },
      ],
      retry_policy: {
        max_attempts: 4,
        backoff_ms: 1500,
        backoff_multiplier: 2,
        max_backoff_ms: 15000,
        retry_on: ["timeout", "http_429"],
      },
    };

    const result = validateStepAgainstSchema(step);
    expect(result.valid).toBe(true);
  });
});
