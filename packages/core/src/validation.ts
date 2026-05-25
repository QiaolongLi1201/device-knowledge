import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type DeviceKnowledgeModuleData,
  type DeviceKnowledgeModuleManifest,
  type DeviceKnowledgeModuleOrigin,
  type ValidationIssue,
  type ValidationResult,
  validationFailed,
  validationOk,
} from './types.js';

const ORIGINS = new Set<DeviceKnowledgeModuleOrigin>(['official', 'community', 'user']);

const PRIORITY_RANGES: Record<DeviceKnowledgeModuleOrigin, { min: number; max: number }> = {
  official: { min: 0, max: 99 },
  community: { min: 100, max: 499 },
  user: { min: 500, max: 999 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(
  issues: ValidationIssue[],
  input: Record<string, unknown>,
  key: string,
  path = key,
): string | undefined {
  const value = input[key];
  if (typeof value === 'string' && value.trim()) return value;
  issues.push({
    path,
    code: 'invalid-string',
    message: `${path} must be a non-empty string`,
  });
  return undefined;
}

export function validateManifest(input: unknown): ValidationResult<DeviceKnowledgeModuleManifest> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(input)) {
    return validationFailed([
      { path: '', code: 'invalid-object', message: 'manifest must be an object' },
    ]);
  }

  const schemaVersion = input.schemaVersion;
  if (schemaVersion !== DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION) {
    issues.push({
      path: 'schemaVersion',
      code: 'invalid-schema-version',
      message: `schemaVersion must be ${DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION}`,
    });
  }

  const id = requireString(issues, input, 'id');
  const name = requireString(issues, input, 'name');
  const version = requireString(issues, input, 'version');
  const originValue = input.origin;
  const origin =
    typeof originValue === 'string' && ORIGINS.has(originValue as DeviceKnowledgeModuleOrigin)
      ? (originValue as DeviceKnowledgeModuleOrigin)
      : undefined;
  if (!origin) {
    issues.push({
      path: 'origin',
      code: 'invalid-origin',
      message: 'origin must be official, community, or user',
    });
  }

  const priority = input.priority;
  const priorityNumber = typeof priority === 'number' && Number.isInteger(priority) ? priority : undefined;
  if (priorityNumber === undefined) {
    issues.push({
      path: 'priority',
      code: 'invalid-priority',
      message: 'priority must be an integer',
    });
  } else if (origin) {
    const range = PRIORITY_RANGES[origin];
    if (priorityNumber < range.min || priorityNumber > range.max) {
      issues.push({
        path: 'priority',
        code: 'invalid-priority-range',
        message: `${origin} priority must be between ${range.min} and ${range.max}`,
      });
    }
  }

  if (input.family !== undefined && (typeof input.family !== 'string' || !input.family.trim())) {
    issues.push({
      path: 'family',
      code: 'invalid-string',
      message: 'family must be a non-empty string when provided',
    });
  }

  if (!isRecord(input.compatibility)) {
    issues.push({
      path: 'compatibility',
      code: 'invalid-object',
      message: 'compatibility must be an object',
    });
  } else {
    requireString(issues, input.compatibility, 'dmossKnowledgeModule', 'compatibility.dmossKnowledgeModule');
    if (
      input.compatibility.minRdkStudio !== undefined &&
      (typeof input.compatibility.minRdkStudio !== 'string' || !input.compatibility.minRdkStudio.trim())
    ) {
      issues.push({
        path: 'compatibility.minRdkStudio',
        code: 'invalid-string',
        message: 'compatibility.minRdkStudio must be a non-empty string when provided',
      });
    }
  }

  if (issues.length) return validationFailed(issues);

  const compatibility = input.compatibility as {
    dmossKnowledgeModule: string;
    minRdkStudio?: string;
  };

  return validationOk({
    schemaVersion: DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
    id: id!,
    name: name!,
    version: version!,
    origin: origin!,
    family: typeof input.family === 'string' ? input.family : undefined,
    priority: priorityNumber!,
    compatibility: {
      dmossKnowledgeModule: compatibility.dmossKnowledgeModule,
      minRdkStudio: compatibility.minRdkStudio,
    },
  });
}

function validateOptionalArray(
  issues: ValidationIssue[],
  input: Record<string, unknown>,
  key: keyof DeviceKnowledgeModuleData,
): void {
  const value = input[key];
  if (value !== undefined && !Array.isArray(value)) {
    issues.push({
      path: String(key),
      code: 'invalid-array',
      message: `${String(key)} must be an array when provided`,
    });
  }
}

export function validateDeviceKnowledgeModule(input: unknown): ValidationResult<DeviceKnowledgeModuleData> {
  if (!isRecord(input)) {
    return validationFailed([
      { path: '', code: 'invalid-object', message: 'module must be an object' },
    ]);
  }

  const manifestResult = validateManifest(input.manifest);
  const issues: ValidationIssue[] = manifestResult.ok
    ? []
    : manifestResult.issues.map((issue) => ({
        ...issue,
        path: issue.path ? `manifest.${issue.path}` : 'manifest',
      }));

  const profiles = input.profiles;
  if (profiles !== undefined && !isRecord(profiles)) {
    issues.push({
      path: 'profiles',
      code: 'invalid-object',
      message: 'profiles must be an object when provided',
    });
  }

  validateOptionalArray(issues, input, 'docs');
  validateOptionalArray(issues, input, 'promptFragments');
  validateOptionalArray(issues, input, 'commandPatterns');
  validateOptionalArray(issues, input, 'failureHints');
  validateOptionalArray(issues, input, 'skills');
  if (input.ecosystemText !== undefined && typeof input.ecosystemText !== 'string') {
    issues.push({
      path: 'ecosystemText',
      code: 'invalid-string',
      message: 'ecosystemText must be a string when provided',
    });
  }

  if (issues.length) return validationFailed(issues);
  if (!manifestResult.ok) return validationFailed(issues);

  return validationOk({
    manifest: manifestResult.value,
    profiles: profiles as Record<string, unknown> | undefined,
    docs: input.docs as unknown[] | undefined,
    promptFragments: input.promptFragments as unknown[] | undefined,
    commandPatterns: input.commandPatterns as unknown[] | undefined,
    failureHints: input.failureHints as unknown[] | undefined,
    skills: input.skills as unknown[] | undefined,
    ecosystemText: input.ecosystemText as string | undefined,
  });
}
