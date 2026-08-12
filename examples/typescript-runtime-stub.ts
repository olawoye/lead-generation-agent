/**
 * Example: TypeScript runtime stub.
 *
 * Demonstrates how a TypeScript runtime would load the outbound-lead-discovery
 * agent definition, resolve execution order, and iterate over steps.
 *
 * This file is for illustration only — it does not invoke any real AI provider.
 */

import * as path from "path";
import { loadDefinition } from "../src/loader";
import { resolveExecutionOrder, validateToolReferences } from "../src/resolver";
import type { AgentDefinition, Step } from "../src/types";

// ── Load & validate ──────────────────────────────────────────────────────────

const definitionPath = path.resolve(
  __dirname,
  "../definitions/outbound-lead-discovery.v1.0.0.yaml"
);

const { definition, valid, errors } = loadDefinition(definitionPath);

if (!valid) {
  console.error("Definition is invalid:", errors);
  process.exit(1);
}

// ── Validate tool references ─────────────────────────────────────────────────

const toolErrors = validateToolReferences(definition);
if (toolErrors.length > 0) {
  console.error("Tool reference errors:", toolErrors);
  process.exit(1);
}

// ── Print summary ────────────────────────────────────────────────────────────

const { metadata, spec } = definition;

console.log(`Agent: ${metadata.displayName} v${metadata.version}`);
console.log(`Objective: ${spec.objective.summary}`);
console.log();
console.log("ORAR:");
console.log("  Objective:", spec.orar.objective);
console.log("  Resources:", spec.orar.resources.length);
console.log("  Actions:  ", spec.orar.actions.length);
console.log("  Results:  ", spec.orar.results.length);
console.log();

// ── Resolve execution order ───────────────────────────────────────────────────

const resolvedSteps = resolveExecutionOrder(definition);
console.log(`Execution plan (${resolvedSteps.length} steps):`);
console.log();

let currentWave = -1;
for (const { step, wave } of resolvedSteps) {
  if (wave !== currentWave) {
    console.log(`  ── Wave ${wave} ${"─".repeat(40)}`);
    currentWave = wave;
  }
  const deps = step.dependsOn?.length ? step.dependsOn.join(", ") : "(none)";
  const tools = step.tools?.length ? step.tools.join(", ") : "(none)";
  const inputSummary = Array.isArray(step.inputs)
    ? step.inputs.join(", ")
    : step.inputs
      ? Object.keys(step.inputs).join(", ")
      : "(none)";
  const outputSummary = Array.isArray(step.outputs)
    ? step.outputs.join(", ")
    : step.outputs
      ? Object.keys(step.outputs).join(", ")
      : "(none)";

  console.log(`  [${step.id}]`);
  console.log(`    Name:       ${step.name}`);
  console.log(`    DependsOn:  ${deps}`);
  console.log(`    Tools:      ${tools}`);
  console.log(`    Inputs:     ${inputSummary}`);
  console.log(`    Outputs:    ${outputSummary}`);
  console.log();
}

// ── Policies ─────────────────────────────────────────────────────────────────

if (spec.policies) {
  console.log("Policies:");
  console.log(JSON.stringify(spec.policies, null, 2));
}

// ── Simulate runtime step dispatch ───────────────────────────────────────────

/**
 * In a real runtime this function would call an AI model or tool orchestrator.
 * Here we just print what it would do.
 */
function executeStep(step: Step, _agentDef: AgentDefinition): void {
  console.log(`[RUNTIME] Executing step: ${step.id}`);
  console.log(`          Instruction seed: "${step.description.trim().slice(0, 80)}…"`);
}

console.log("\n── Simulated dispatch ──────────────────────────────────────────");
for (const { step } of resolvedSteps) {
  executeStep(step, definition);
}
