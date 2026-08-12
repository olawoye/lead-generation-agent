/**
 * CLI validation script.
 *
 * Usage:
 *   npx ts-node src/validate.ts <path-to-definition.yaml>
 *
 * Exits with code 0 on success, 1 on failure.
 */

import { loadDefinition } from "./loader";
import { resolveExecutionOrder, validateToolReferences } from "./resolver";

const [, , filePath] = process.argv;

if (!filePath) {
  console.error("Usage: ts-node src/validate.ts <path-to-definition.yaml>");
  process.exit(1);
}

const result = loadDefinition(filePath);

if (!result.valid) {
  console.error("❌  Schema validation failed:");
  result.errors.forEach((e) => console.error(`   • ${e}`));
  process.exit(1);
}

const toolErrors = validateToolReferences(result.definition);
if (toolErrors.length > 0) {
  console.error("❌  Tool reference errors:");
  toolErrors.forEach((e) => console.error(`   • ${e}`));
  process.exit(1);
}

try {
  const order = resolveExecutionOrder(result.definition);
  console.log(`✅  "${result.definition.metadata.displayName ?? result.definition.metadata.name}" v${result.definition.metadata.version} — valid`);
  console.log(`\nExecution order (${order.length} steps):`);
  for (const { step, wave } of order) {
    console.log(`  wave ${wave}  [${step.id}]  ${step.name}`);
  }
} catch (err) {
  console.error(`❌  Execution order error: ${(err as Error).message}`);
  process.exit(1);
}
