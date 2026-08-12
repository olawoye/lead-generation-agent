/**
 * Resolver: provides utilities for inspecting and topologically sorting
 * the steps declared in an AgentDefinition.
 *
 * The runtime uses this to determine a valid execution order that respects
 * all `dependsOn` constraints. This module is purely declarative — it does
 * not call any AI provider, MCP, or framework.
 */

import type { AgentDefinition, Step } from "./types";

export interface ResolvedStep {
  step: Step;
  /** Zero-based execution wave. Steps in the same wave may run concurrently. */
  wave: number;
}

/**
 * Topologically sort the steps in an AgentDefinition respecting `dependsOn`.
 *
 * Steps with no dependencies are in wave 0. A step's wave is
 * max(dependency waves) + 1.
 *
 * @throws Error if a cycle is detected or if a dependsOn ID is unknown.
 */
export function resolveExecutionOrder(
  definition: AgentDefinition
): ResolvedStep[] {
  const steps = definition.spec.steps.filter((step) => step.enabled !== false);
  const idSet = new Set(steps.map((s) => s.id));

  // Validate that all dependsOn IDs exist
  for (const step of steps) {
    for (const dep of step.dependsOn ?? []) {
      if (!idSet.has(dep)) {
        throw new Error(
          `Step "${step.id}" has unknown dependency "${dep}"`
        );
      }
    }
  }

  const waveMap = new Map<string, number>();

  function computeWave(stepId: string, visiting: Set<string>): number {
    if (waveMap.has(stepId)) return waveMap.get(stepId)!;
    if (visiting.has(stepId)) {
      throw new Error(
        `Circular dependency detected involving step "${stepId}"`
      );
    }

    visiting.add(stepId);
    const step = steps.find((s) => s.id === stepId)!;
    const deps = step.dependsOn ?? [];

    let wave = 0;
    for (const dep of deps) {
      wave = Math.max(wave, computeWave(dep, visiting) + 1);
    }

    visiting.delete(stepId);
    waveMap.set(stepId, wave);
    return wave;
  }

  for (const step of steps) {
    computeWave(step.id, new Set());
  }

  return steps
    .map((step) => ({ step, wave: waveMap.get(step.id)! }))
    .sort((a, b) => a.wave - b.wave || steps.indexOf(a.step) - steps.indexOf(b.step));
}

/**
 * Validate that all tool IDs referenced in steps are declared in spec.tools.
 *
 * @returns Array of error messages; empty if everything is consistent.
 */
export function validateToolReferences(definition: AgentDefinition): string[] {
  const declaredTools = new Set(
    (definition.spec.tools ?? []).map((t) => t.id)
  );
  const errors: string[] = [];

  for (const step of definition.spec.steps) {
    for (const toolId of step.tools ?? []) {
      if (!declaredTools.has(toolId)) {
        errors.push(
          `Step "${step.id}" references undeclared tool "${toolId}"`
        );
      }
    }
  }

  return errors;
}
