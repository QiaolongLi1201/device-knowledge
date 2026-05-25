import {
  DEVICE_KNOWLEDGE_MODULE_SCHEMA_VERSION,
  type CommandPattern,
  type CommandRiskLevel,
  type DeviceKnowledgeModuleData,
  type DeviceKnowledgeModuleManifest,
  type DeviceKnowledgeModuleOrigin,
  type DocIndexEntry,
  type EndorsedSkillRef,
  type FailureHint,
  type KnowledgeConfidence,
  type KnowledgeRecordBase,
  type KnowledgeRecordStatus,
  type KnowledgeSourceRef,
  type KnowledgeSourceType,
  type PromptFragment,
  type SerializedRegex,
  type ValidationIssue,
  type ValidationResult,
  validationFailed,
  validationOk,
} from './types.js';
import { validateSerializedRegex } from './regex.js';

const ORIGINS = new Set<DeviceKnowledgeModuleOrigin>(['official', 'community', 'user']);
const SOURCE_TYPES = new Set<KnowledgeSourceType>(['official-doc', 'github', 'forum', 'community', 'local', 'generated']);
const STATUSES = new Set<KnowledgeRecordStatus>(['active', 'deprecated', 'draft']);
const CONFIDENCES = new Set<KnowledgeConfidence>(['high', 'medium', 'low']);
const RISK_LEVELS = new Set<CommandRiskLevel>(['safe', 'moderate', 'dangerous']);
const CHUNK_STRATEGIES = new Set(['none', 'heading', 'paragraph', 'qa', 'command', 'release-note']);

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

function optionalStringArray(issues: ValidationIssue[], input: Record<string, unknown>, key: string, path: string): string[] | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    issues.push({ path, code: 'invalid-string-array', message: `${path} must be an array of non-empty strings` });
    return undefined;
  }
  return value;
}

function optionalString(issues: ValidationIssue[], input: Record<string, unknown>, key: string, path: string): string | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value === 'string' && value.trim()) return value;
  issues.push({ path, code: 'invalid-string', message: `${path} must be a non-empty string when provided` });
  return undefined;
}

function validateSource(issues: ValidationIssue[], input: unknown, path: string): KnowledgeSourceRef | undefined {
  if (!isRecord(input)) {
    issues.push({ path, code: 'invalid-source', message: `${path} must be an object` });
    return undefined;
  }
  if (typeof input.type !== 'string' || !SOURCE_TYPES.has(input.type as KnowledgeSourceType)) {
    issues.push({ path: `${path}.type`, code: 'invalid-source-type', message: `${path}.type is invalid` });
  }
  const url = optionalString(issues, input, 'url', `${path}.url`);
  const repo = optionalString(issues, input, 'repo', `${path}.repo`);
  const commit = optionalString(issues, input, 'commit', `${path}.commit`);
  const documentVersion = optionalString(issues, input, 'documentVersion', `${path}.documentVersion`);
  const retrievedAt = optionalString(issues, input, 'retrievedAt', `${path}.retrievedAt`);
  if (issues.some((issue) => issue.path.startsWith(path))) return undefined;
  return {
    type: input.type as KnowledgeSourceType,
    ...(url ? { url } : {}),
    ...(repo ? { repo } : {}),
    ...(commit ? { commit } : {}),
    ...(documentVersion ? { documentVersion } : {}),
    ...(retrievedAt ? { retrievedAt } : {}),
  };
}

function validateScope(issues: ValidationIssue[], input: unknown, path: string): KnowledgeRecordBase['scope'] | undefined {
  if (input === undefined) return undefined;
  if (!isRecord(input)) {
    issues.push({ path, code: 'invalid-object', message: `${path} must be an object when provided` });
    return undefined;
  }
  const scope = {
    platforms: optionalStringArray(issues, input, 'platforms', `${path}.platforms`),
    boards: optionalStringArray(issues, input, 'boards', `${path}.boards`),
    socs: optionalStringArray(issues, input, 'socs', `${path}.socs`),
    rdkVersions: optionalStringArray(issues, input, 'rdkVersions', `${path}.rdkVersions`),
    osVersions: optionalStringArray(issues, input, 'osVersions', `${path}.osVersions`),
    toolchains: optionalStringArray(issues, input, 'toolchains', `${path}.toolchains`),
  };
  return Object.fromEntries(Object.entries(scope).filter(([, value]) => value !== undefined));
}

function validateRecordBase(issues: ValidationIssue[], input: Record<string, unknown>, path: string): KnowledgeRecordBase | undefined {
  const id = requireString(issues, input, 'id', `${path}.id`);
  const source = validateSource(issues, input.source, `${path}.source`);
  const scope = validateScope(issues, input.scope, `${path}.scope`);
  const tags = optionalStringArray(issues, input, 'tags', `${path}.tags`);
  const language = optionalString(issues, input, 'language', `${path}.language`);
  const citationLabel = optionalString(issues, input, 'citationLabel', `${path}.citationLabel`);
  const lastReviewedAt = optionalString(issues, input, 'lastReviewedAt', `${path}.lastReviewedAt`);
  const validFrom = optionalString(issues, input, 'validFrom', `${path}.validFrom`);
  const validTo = optionalString(issues, input, 'validTo', `${path}.validTo`);
  const supersedes = optionalStringArray(issues, input, 'supersedes', `${path}.supersedes`);
  const status = input.status;
  const confidence = input.confidence;
  const priority = input.priority;
  if (status !== undefined && (typeof status !== 'string' || !STATUSES.has(status as KnowledgeRecordStatus))) {
    issues.push({ path: `${path}.status`, code: 'invalid-status', message: `${path}.status is invalid` });
  }
  if (confidence !== undefined && (typeof confidence !== 'string' || !CONFIDENCES.has(confidence as KnowledgeConfidence))) {
    issues.push({ path: `${path}.confidence`, code: 'invalid-confidence', message: `${path}.confidence is invalid` });
  }
  if (priority !== undefined && (typeof priority !== 'number' || !Number.isFinite(priority))) {
    issues.push({ path: `${path}.priority`, code: 'invalid-priority', message: `${path}.priority must be a finite number` });
  }
  if (!id || !source) return undefined;
  return {
    id,
    source,
    ...(scope && Object.keys(scope).length ? { scope } : {}),
    ...(tags ? { tags } : {}),
    ...(language ? { language } : {}),
    ...(typeof status === 'string' ? { status: status as KnowledgeRecordStatus } : {}),
    ...(typeof confidence === 'string' ? { confidence: confidence as KnowledgeConfidence } : {}),
    ...(typeof priority === 'number' ? { priority } : {}),
    ...(lastReviewedAt ? { lastReviewedAt } : {}),
    ...(validFrom ? { validFrom } : {}),
    ...(validTo ? { validTo } : {}),
    ...(supersedes ? { supersedes } : {}),
    ...(citationLabel ? { citationLabel } : {}),
  };
}

function validateRegex(issues: ValidationIssue[], input: unknown, path: string): SerializedRegex | undefined {
  const result = validateSerializedRegex(input);
  if (result.ok) return result.value;
  issues.push(...result.issues.map((issue) => ({ ...issue, path: issue.path ? `${path}.${issue.path}` : path })));
  return undefined;
}

function validateDocEntry(issues: ValidationIssue[], entry: unknown, path: string): DocIndexEntry | undefined {
  if (!isRecord(entry)) {
    issues.push({ path, code: 'invalid-object', message: `${path} must be an object` });
    return undefined;
  }
  const title = requireString(issues, entry, 'title', `${path}.title`);
  const url = requireString(issues, entry, 'url', `${path}.url`);
  const section = requireString(issues, entry, 'section', `${path}.section`);
  const base = validateRecordBase(issues, entry, path);
  const sectionPath = optionalStringArray(issues, entry, 'sectionPath', `${path}.sectionPath`);
  const anchors = optionalStringArray(issues, entry, 'anchors', `${path}.anchors`);
  const metadataForEmbedding = optionalStringArray(issues, entry, 'metadataForEmbedding', `${path}.metadataForEmbedding`);
  const metadataForPrompt = optionalStringArray(issues, entry, 'metadataForPrompt', `${path}.metadataForPrompt`);
  let chunkPolicy: DocIndexEntry['chunkPolicy'];
  if (entry.chunkPolicy !== undefined) {
    if (!isRecord(entry.chunkPolicy) || typeof entry.chunkPolicy.strategy !== 'string' || !CHUNK_STRATEGIES.has(entry.chunkPolicy.strategy)) {
      issues.push({ path: `${path}.chunkPolicy`, code: 'invalid-chunk-policy', message: `${path}.chunkPolicy.strategy is invalid` });
    } else {
      chunkPolicy = {
        strategy: entry.chunkPolicy.strategy as NonNullable<DocIndexEntry['chunkPolicy']>['strategy'],
        ...(typeof entry.chunkPolicy.maxTokens === 'number' ? { maxTokens: entry.chunkPolicy.maxTokens } : {}),
        ...(typeof entry.chunkPolicy.overlapTokens === 'number' ? { overlapTokens: entry.chunkPolicy.overlapTokens } : {}),
      };
    }
  }
  if (!base || !title || !url || !section) return undefined;
  return {
    ...base,
    title,
    url,
    sourceUrl: typeof entry.sourceUrl === 'string' ? entry.sourceUrl : url,
    sourceType: typeof entry.sourceType === 'string' ? (entry.sourceType as KnowledgeSourceType) : base.source.type,
    section,
    ...(sectionPath ? { sectionPath } : {}),
    ...(anchors ? { anchors } : {}),
    ...(typeof entry.pageHint === 'string' ? { pageHint: entry.pageHint } : {}),
    ...(chunkPolicy ? { chunkPolicy } : {}),
    ...(typeof entry.parentId === 'string' ? { parentId: entry.parentId } : {}),
    ...(typeof entry.prevId === 'string' ? { prevId: entry.prevId } : {}),
    ...(typeof entry.nextId === 'string' ? { nextId: entry.nextId } : {}),
    ...(metadataForEmbedding ? { metadataForEmbedding } : {}),
    ...(metadataForPrompt ? { metadataForPrompt } : {}),
  };
}

function validatePromptFragment(issues: ValidationIssue[], entry: unknown, path: string): PromptFragment | undefined {
  if (!isRecord(entry)) {
    issues.push({ path, code: 'invalid-object', message: `${path} must be an object` });
    return undefined;
  }
  const base = validateRecordBase(issues, entry, path);
  const section = requireString(issues, entry, 'section', `${path}.section`);
  const tier = requireString(issues, entry, 'tier', `${path}.tier`);
  const mode = requireString(issues, entry, 'mode', `${path}.mode`);
  const content = requireString(issues, entry, 'content', `${path}.content`);
  if (typeof entry.priority !== 'number' || !Number.isFinite(entry.priority)) {
    issues.push({ path: `${path}.priority`, code: 'invalid-priority', message: `${path}.priority must be a finite number` });
  }
  if (!base || !section || !tier || !mode || !content || typeof entry.priority !== 'number') return undefined;
  return { ...base, section, tier, mode, content, priority: entry.priority };
}

function validateCommandPattern(issues: ValidationIssue[], entry: unknown, path: string): CommandPattern | undefined {
  if (!isRecord(entry)) {
    issues.push({ path, code: 'invalid-object', message: `${path} must be an object` });
    return undefined;
  }
  const base = validateRecordBase(issues, entry, path);
  const pattern = validateRegex(issues, entry.pattern, `${path}.pattern`);
  const category = requireString(issues, entry, 'category', `${path}.category`);
  const description = requireString(issues, entry, 'description', `${path}.description`);
  if (typeof entry.riskLevel !== 'string' || !RISK_LEVELS.has(entry.riskLevel as CommandRiskLevel)) {
    issues.push({ path: `${path}.riskLevel`, code: 'invalid-risk-level', message: `${path}.riskLevel is invalid` });
  }
  if (!base || !pattern || !category || !description || typeof entry.riskLevel !== 'string') return undefined;
  return { ...base, pattern, category, description, riskLevel: entry.riskLevel as CommandRiskLevel };
}

function validateFailureHint(issues: ValidationIssue[], entry: unknown, path: string): FailureHint | undefined {
  if (!isRecord(entry)) {
    issues.push({ path, code: 'invalid-object', message: `${path} must be an object` });
    return undefined;
  }
  const base = validateRecordBase(issues, entry, path);
  const errorPattern = validateRegex(issues, entry.errorPattern, `${path}.errorPattern`);
  const suggestion = requireString(issues, entry, 'suggestion', `${path}.suggestion`);
  if (!base || !errorPattern || !suggestion) return undefined;
  return { ...base, errorPattern, suggestion, ...(typeof entry.docUrl === 'string' ? { docUrl: entry.docUrl } : {}) };
}

function validateSkillRef(issues: ValidationIssue[], entry: unknown, path: string): EndorsedSkillRef | undefined {
  if (!isRecord(entry)) {
    issues.push({ path, code: 'invalid-object', message: `${path} must be an object` });
    return undefined;
  }
  const base = validateRecordBase(issues, entry, path);
  if (!base) return undefined;
  const platforms = optionalStringArray(issues, entry, 'platforms', `${path}.platforms`);
  return {
    ...base,
    ...(typeof entry.category === 'string' ? { category: entry.category } : {}),
    ...(platforms ? { platforms } : {}),
  };
}

function validateRecordArray<T>(
  issues: ValidationIssue[],
  input: Record<string, unknown>,
  key: keyof DeviceKnowledgeModuleData,
  validator: (issues: ValidationIssue[], entry: unknown, path: string) => T | undefined,
): T[] | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    issues.push({ path: String(key), code: 'invalid-array', message: `${String(key)} must be an array when provided` });
    return undefined;
  }
  const results: T[] = [];
  value.forEach((entry, index) => {
    const result = validator(issues, entry, `${String(key)}.${index}`);
    if (result) results.push(result);
  });
  return results;
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

  const docs = validateRecordArray(issues, input, 'docs', validateDocEntry);
  const promptFragments = validateRecordArray(issues, input, 'promptFragments', validatePromptFragment);
  const commandPatterns = validateRecordArray(issues, input, 'commandPatterns', validateCommandPattern);
  const failureHints = validateRecordArray(issues, input, 'failureHints', validateFailureHint);
  const skills = validateRecordArray(issues, input, 'skills', validateSkillRef);
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
    docs,
    promptFragments,
    commandPatterns,
    failureHints,
    skills,
    ecosystemText: input.ecosystemText as string | undefined,
  });
}
