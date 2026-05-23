export const DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION = 'device-knowledge.module.v1';

export type DeviceKnowledgeModuleOrigin = 'official' | 'community' | 'user';

export interface DeviceKnowledgeModuleManifest {
  schemaVersion: typeof DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION;
  id: string;
  name: string;
  origin: DeviceKnowledgeModuleOrigin;
  family?: string;
  priority: number;
  compatibility: {
    dmossKnowledgeModule: string;
    minRdkStudio?: string;
  };
}

export interface SerializedRegex {
  source: string;
  flags?: string;
}

export interface DeviceKnowledgeModuleData {
  manifest: DeviceKnowledgeModuleManifest;
  profiles?: Record<string, unknown>;
  docs?: unknown[];
  promptFragments?: unknown[];
  commandPatterns?: unknown[];
  failureHints?: unknown[];
  skills?: unknown[];
}

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T; issues: [] }
  | { ok: false; issues: ValidationIssue[] };

export function validationOk<T>(value: T): ValidationResult<T> {
  return { ok: true, value, issues: [] };
}

export function validationFailed<T = never>(issues: ValidationIssue[]): ValidationResult<T> {
  return { ok: false, issues };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
