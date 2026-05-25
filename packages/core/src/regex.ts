import {
  type SerializedRegex,
  type ValidationIssue,
  type ValidationResult,
  validationFailed,
  validationOk,
} from './types.js';

const VALID_REGEX_FLAGS = new Set(['d', 'g', 'i', 'm', 's', 'u', 'v', 'y']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateFlags(flags: string): boolean {
  const seen = new Set<string>();
  for (const flag of flags) {
    if (!VALID_REGEX_FLAGS.has(flag) || seen.has(flag)) return false;
    seen.add(flag);
  }
  if (seen.has('u') && seen.has('v')) return false;
  return true;
}

export function validateSerializedRegex(input: unknown): ValidationResult<SerializedRegex> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    return validationFailed([
      { path: '', code: 'invalid-object', message: 'regex must be an object' },
    ]);
  }

  if (typeof input.source !== 'string' || !input.source.length) {
    issues.push({
      path: 'source',
      code: 'invalid-regex-source',
      message: 'source must be a non-empty string',
    });
  }

  if (input.flags !== undefined) {
    if (typeof input.flags !== 'string' || !validateFlags(input.flags)) {
      issues.push({
        path: 'flags',
        code: 'invalid-regex-flags',
        message: 'flags must contain unique JavaScript regex flags',
      });
    }
  }

  if (issues.length === 0) {
    try {
      new RegExp(input.source as string, input.flags as string | undefined);
    } catch (err) {
      issues.push({
        path: 'source',
        code: 'invalid-regex-source',
        message: err instanceof Error ? err.message : 'regex must compile as a JavaScript RegExp',
      });
    }
  }

  if (issues.length) return validationFailed(issues);

  return validationOk({
    source: input.source as string,
    flags: input.flags as string | undefined,
  });
}

export function compileSerializedRegex(input: SerializedRegex): RegExp {
  const result = validateSerializedRegex(input);
  if (!result.ok) {
    const message = result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
    throw new Error(`Invalid serialized regex: ${message}`);
  }
  return new RegExp(result.value.source, result.value.flags);
}

export function serializedRegexFromLegacyRobotHubPattern(pattern: string): SerializedRegex {
  if (typeof pattern !== 'string' || !pattern.length) {
    throw new Error('Legacy Robot Hub regex pattern must be a non-empty string');
  }
  return { source: pattern, flags: 'i' };
}
