/**
 * Loader: reads a YAML or JSON agent-definition file and returns a parsed
 * AgentDefinition object validated against the JSON Schema.
 *
 * This module has zero dependencies on any AI provider, MCP, or runtime framework.
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import type { AgentDefinition } from "./types";

const schemaPath = path.resolve(
  __dirname,
  "../schemas/v1/agent-definition.schema.json"
);

let _validate: ValidateFunction | null = null;

function getValidator(): ValidateFunction {
  if (_validate) return _validate;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  _validate = ajv.compile(schema);
  return _validate;
}

export interface LoadResult {
  definition: AgentDefinition;
  valid: boolean;
  errors: string[];
}

/**
 * Load and validate an agent definition from a YAML or JSON file.
 *
 * @param filePath - Absolute or relative path to the definition file.
 * @returns A LoadResult with the parsed definition and any validation errors.
 */
export function loadDefinition(filePath: string): LoadResult {
  const resolved = path.resolve(filePath);
  const raw = fs.readFileSync(resolved, "utf8");
  const ext = path.extname(resolved).toLowerCase();

  let parsed: unknown;
  if (ext === ".yaml" || ext === ".yml") {
    parsed = yaml.load(raw);
  } else {
    parsed = JSON.parse(raw);
  }

  const validate = getValidator();
  const valid = validate(parsed) as boolean;
  const errors = valid
    ? []
    : (validate.errors ?? []).map(
        (e) => `${e.instancePath || "(root)"} ${e.message}`
      );

  return {
    definition: parsed as AgentDefinition,
    valid,
    errors,
  };
}
